-- ============================================================
-- Add last_selected column to business_user table
-- Tracks which business context the user last selected
-- ============================================================

-- Add last_selected column
alter table public.business_user
  add column last_selected boolean not null default false;

-- Add index for fast lookup of last selected business per user
create index idx_business_user_last_selected
  on public.business_user(user_id, last_selected)
  where last_selected = true;

-- Add comment
comment on column public.business_user.last_selected is 'Tracks the last business context selected by this user (for multi-business users)';
