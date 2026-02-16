-- ============================================================
-- RPC: accept_invite
-- Atomically accepts an invite by creating business_user and
-- business_user_branch records for all assigned branches,
-- then marks invite as accepted
-- ============================================================
create or replace function public.accept_invite(
  p_invite_id uuid
) returns json as $$
declare
  v_invite public.invite;
  v_bu public.business_user;
  v_branch_id uuid;
  v_first_branch_id uuid;
begin
  -- Get the invite and verify it's valid
  select * into v_invite
    from public.invite
    where id = p_invite_id
      and status = 'pending'
      and expires_at > now();

  if v_invite is null then
    raise exception 'Invite not found, already accepted, or expired';
  end if;

  -- Get first branch ID for last_branch_id
  if array_length(v_invite.branch_ids, 1) > 0 then
    v_first_branch_id := v_invite.branch_ids[1];
  else
    raise exception 'Invite has no branches assigned';
  end if;

  -- Create business_user record with the invite's role
  insert into public.business_user (business_id, user_id, role, last_branch_id)
    values (v_invite.business_id, auth.uid(), v_invite.role, v_first_branch_id)
    returning * into v_bu;

  -- Create business_user_branch assignments for all branches
  foreach v_branch_id in array v_invite.branch_ids
  loop
    insert into public.business_user_branch (business_user_id, branch_id)
      values (v_bu.id, v_branch_id);
  end loop;

  -- Mark invite as accepted
  update public.invite
    set status = 'accepted', claimed_by = auth.uid()
    where id = p_invite_id;

  return json_build_object(
    'business_user', row_to_json(v_bu),
    'branch_count', array_length(v_invite.branch_ids, 1)
  );
end;
$$ language plpgsql security definer;
