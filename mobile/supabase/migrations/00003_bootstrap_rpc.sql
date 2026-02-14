-- ============================================================
-- RPC: bootstrap_business
-- Atomically creates a business, its first branch, and the
-- admin business_user record for the calling user.
-- ============================================================
create or replace function public.bootstrap_business(
  p_business_name text,
  p_branch_name text
) returns json as $$
declare
  v_business public.business;
  v_branch public.branch;
  v_bu public.business_user;
begin
  -- Create business
  insert into public.business (name)
    values (p_business_name)
    returning * into v_business;

  -- Create first branch
  insert into public.branch (business_id, name)
    values (v_business.id, p_branch_name)
    returning * into v_branch;

  -- Create admin membership with last_branch_id set
  insert into public.business_user (business_id, user_id, role, last_branch_id)
    values (v_business.id, auth.uid(), 'admin', v_branch.id)
    returning * into v_bu;

  return json_build_object(
    'business', row_to_json(v_business),
    'branch', row_to_json(v_branch),
    'business_user', row_to_json(v_bu)
  );
end;
$$ language plpgsql security definer;
