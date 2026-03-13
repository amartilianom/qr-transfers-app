-- Add display name to invite
alter table public.invite
  add column if not exists name text not null default '';

-- Add name + whatsapp to business_user for admin-managed display info
alter table public.business_user
  add column if not exists name text,
  add column if not exists whatsapp text;

-- Update accept_invite to carry name/whatsapp from invite into business_user
create or replace function public.accept_invite(
  p_invite_id uuid
) returns json as $$
declare
  v_invite public.invite;
  v_bu public.business_user;
  v_branch_id uuid;
  v_first_branch_id uuid;
begin
  select * into v_invite
    from public.invite
    where id = p_invite_id
      and status = 'pending'
      and expires_at > now();

  if v_invite is null then
    raise exception 'Invite not found, already accepted, or expired';
  end if;

  if array_length(v_invite.branch_ids, 1) > 0 then
    v_first_branch_id := v_invite.branch_ids[1];
  else
    raise exception 'Invite has no branches assigned';
  end if;

  insert into public.business_user (business_id, user_id, role, last_branch_id, name, whatsapp)
    values (v_invite.business_id, auth.uid(), v_invite.role, v_first_branch_id, v_invite.name, v_invite.phone)
    returning * into v_bu;

  foreach v_branch_id in array v_invite.branch_ids
  loop
    insert into public.business_user_branch (business_user_id, branch_id)
      values (v_bu.id, v_branch_id);
  end loop;

  update public.invite
    set status = 'accepted', claimed_by = auth.uid()
    where id = p_invite_id;

  return json_build_object(
    'business_user', row_to_json(v_bu),
    'branch_count', array_length(v_invite.branch_ids, 1)
  );
end;
$$ language plpgsql security definer;
