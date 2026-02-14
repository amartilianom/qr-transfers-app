-- ============================================================
-- Enable RLS on all tables
-- ============================================================
alter table public.business enable row level security;
alter table public.branch enable row level security;
alter table public.business_user enable row level security;
alter table public.business_user_branch enable row level security;
alter table public.invite enable row level security;
alter table public.transfer enable row level security;

-- ============================================================
-- Helper: get accessible branch IDs for current user
-- Admin → all active branches in their business
-- Collaborator → only assigned branches
-- ============================================================
create or replace function public.my_branch_ids()
returns setof uuid as $$
declare
  v_bu record;
begin
  select id, business_id, role into v_bu
    from public.business_user
    where user_id = auth.uid() and active = true
    limit 1;

  if v_bu is null then
    return;
  end if;

  if v_bu.role = 'admin' then
    return query
      select b.id from public.branch b
      where b.business_id = v_bu.business_id and b.active = true;
  else
    return query
      select bub.branch_id from public.business_user_branch bub
      where bub.business_user_id = v_bu.id;
  end if;
end;
$$ language plpgsql security definer stable;

-- ============================================================
-- Business policies
-- ============================================================
create policy "Users can view own business"
  on public.business for select
  using (id in (
    select business_id from public.business_user
    where user_id = auth.uid() and active = true
  ));

create policy "Admins can update business"
  on public.business for update
  using (id in (
    select business_id from public.business_user
    where user_id = auth.uid() and role = 'admin' and active = true
  ));

create policy "Authenticated can insert business"
  on public.business for insert
  with check (auth.uid() is not null);

-- ============================================================
-- Branch policies
-- ============================================================
create policy "Users see accessible branches"
  on public.branch for select
  using (id in (select public.my_branch_ids()));

create policy "Admins insert branches"
  on public.branch for insert
  with check (business_id in (
    select business_id from public.business_user
    where user_id = auth.uid() and role = 'admin' and active = true
  ));

create policy "Admins update branches"
  on public.branch for update
  using (business_id in (
    select business_id from public.business_user
    where user_id = auth.uid() and role = 'admin' and active = true
  ));

-- ============================================================
-- Business User policies
-- ============================================================
create policy "Users see own membership"
  on public.business_user for select
  using (user_id = auth.uid());

create policy "Admins see all memberships"
  on public.business_user for select
  using (business_id in (
    select business_id from public.business_user
    where user_id = auth.uid() and role = 'admin' and active = true
  ));

create policy "Insert own membership"
  on public.business_user for insert
  with check (user_id = auth.uid());

create policy "Admins update memberships"
  on public.business_user for update
  using (
    business_id in (
      select business_id from public.business_user
      where user_id = auth.uid() and role = 'admin' and active = true
    )
    or user_id = auth.uid()
  );

-- ============================================================
-- Business User Branch policies
-- ============================================================
create policy "Users see own branch assignments"
  on public.business_user_branch for select
  using (business_user_id in (
    select id from public.business_user where user_id = auth.uid()
  ));

create policy "Admins manage branch assignments"
  on public.business_user_branch for insert
  with check (business_user_id in (
    select bu2.id from public.business_user bu2
    inner join public.business_user admin_bu
      on admin_bu.business_id = bu2.business_id
    where admin_bu.user_id = auth.uid()
      and admin_bu.role = 'admin'
      and admin_bu.active = true
  ));

create policy "Admins delete branch assignments"
  on public.business_user_branch for delete
  using (business_user_id in (
    select bu2.id from public.business_user bu2
    inner join public.business_user admin_bu
      on admin_bu.business_id = bu2.business_id
    where admin_bu.user_id = auth.uid()
      and admin_bu.role = 'admin'
      and admin_bu.active = true
  ));

-- ============================================================
-- Transfer policies
-- ============================================================
create policy "Users see transfers for their branches"
  on public.transfer for select
  using (branch_id in (select public.my_branch_ids()) and active = true);

create policy "Users insert transfers for their branches"
  on public.transfer for insert
  with check (branch_id in (select public.my_branch_ids()));

create policy "Users update own transfers"
  on public.transfer for update
  using (created_by = auth.uid() and branch_id in (select public.my_branch_ids()));

-- ============================================================
-- Invite policies
-- ============================================================
create policy "Admins manage invites"
  on public.invite for insert
  with check (business_id in (
    select business_id from public.business_user
    where user_id = auth.uid() and role = 'admin' and active = true
  ));

create policy "Admins view invites"
  on public.invite for select
  using (business_id in (
    select business_id from public.business_user
    where user_id = auth.uid() and role = 'admin' and active = true
  ));

create policy "Anyone can read invite by token"
  on public.invite for select
  using (auth.uid() is not null);
