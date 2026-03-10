-- ============================================================
-- RPC: create_branch
-- Creates a branch for a business. Uses security definer to
-- bypass RLS (same pattern as bootstrap_business).
-- ============================================================
create or replace function public.create_branch(
  p_business_id uuid,
  p_name text
) returns json as $$
declare
  v_branch public.branch;
begin
  if not exists (
    select 1 from public.business_user
    where user_id = auth.uid()
      and business_id = p_business_id
      and role = 'admin'
      and active = true
  ) then
    raise exception 'Not authorized';
  end if;

  insert into public.branch (business_id, name)
    values (p_business_id, p_name)
    returning * into v_branch;

  return row_to_json(v_branch);
end;
$$ language plpgsql security definer
set search_path = public, auth;
