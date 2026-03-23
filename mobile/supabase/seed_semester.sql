-- ============================================================
-- Semester test data for Poshitos
-- Jan 6 – Jun 30 2026, Tuesdays closed (DOW = 2)
-- ~10 transfers per cashier per branch per open day
-- ============================================================

-- Business:   Poshitos      e9d46285-01d9-450d-a353-62299bd07f3e
-- Centro:     4c366e99-13b0-4dec-81c0-50648eb1e97c
-- Pochitos:   3ecfa0f7-106d-4270-b03a-df38aaaadcc1
-- Norcasia:   165a83e4-5e1b-4849-9722-09db81cdc472
-- Pochito (admin):     3576c9c6-eb6b-4ff9-8bb7-d28817fc25c6
-- Pochita (cashier):   d5732c13-e89b-42ad-99ee-b7c63bea125c
-- Mauro (cashier):     cfe08db7-8b86-4bf5-8f22-ec9c698b27da
-- cashier-1 (unnamed): 050da919-a58a-4390-bdcf-3a4b09e9e83e
-- cashier-2 (unnamed): 883f489f-b05c-47c1-b46f-6f484c324d19

INSERT INTO public.transfer (branch_id, created_by, amount, provider, transaction_id, occurred_at, active)
SELECT
  bu.branch_id,
  bu.user_id,
  -- Amount 10,000 – 200,000 COP rounded to nearest 500
  (round((random() * 380 + 20)) * 500)::numeric,
  -- Provider weighted: nequi ~40%, daviplata ~25%, bancolombia ~20%, bold ~10%, movii ~5%
  (ARRAY[
    'nequi','nequi','nequi','nequi',
    'daviplata','daviplata','daviplata',
    'bancolombia','bancolombia',
    'bold',
    'movii'
  ])[floor(random() * 11)::int + 1],
  -- ~55% chance of a transaction ID
  CASE WHEN random() > 0.45
    THEN upper(substr(md5(random()::text || t.i::text || d.day::text || bu.user_id::text), 1, 12))
    ELSE NULL
  END,
  -- Shift: 10 am – 9 pm Colombian time (UTC-5) → UTC 15:00 + up to 11 h
  (d.day::timestamptz + interval '15 hours' + (random() * interval '11 hours')),
  true

FROM
  -- Open days Jan 6 – Jun 30 2026, no Tuesdays
  generate_series('2026-01-06'::date, '2026-06-30'::date, '1 day'::interval) AS d(day)

  CROSS JOIN (VALUES
    -- Centro
    ('4c366e99-13b0-4dec-81c0-50648eb1e97c'::uuid, 'cfe08db7-8b86-4bf5-8f22-ec9c698b27da'::uuid),  -- Mauro
    ('4c366e99-13b0-4dec-81c0-50648eb1e97c'::uuid, '883f489f-b05c-47c1-b46f-6f484c324d19'::uuid),  -- cashier-2
    -- Pochitos
    ('3ecfa0f7-106d-4270-b03a-df38aaaadcc1'::uuid, 'd5732c13-e89b-42ad-99ee-b7c63bea125c'::uuid),  -- Pochita
    ('3ecfa0f7-106d-4270-b03a-df38aaaadcc1'::uuid, '050da919-a58a-4390-bdcf-3a4b09e9e83e'::uuid),  -- cashier-1
    ('3ecfa0f7-106d-4270-b03a-df38aaaadcc1'::uuid, '3576c9c6-eb6b-4ff9-8bb7-d28817fc25c6'::uuid),  -- Pochito (admin)
    -- Norcasia
    ('165a83e4-5e1b-4849-9722-09db81cdc472'::uuid, 'cfe08db7-8b86-4bf5-8f22-ec9c698b27da'::uuid),  -- Mauro
    ('165a83e4-5e1b-4849-9722-09db81cdc472'::uuid, '050da919-a58a-4390-bdcf-3a4b09e9e83e'::uuid)   -- cashier-1
  ) AS bu(branch_id, user_id)

  -- Up to 13 transfers per cashier per day; random() > 0.15 drops ~15% → avg ~11
  CROSS JOIN generate_series(1, 13) AS t(i)

WHERE
  EXTRACT(DOW FROM d.day) != 2    -- skip Tuesdays
  AND random() > 0.15;            -- natural day-to-day variation
