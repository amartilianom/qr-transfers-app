-- Security definer RPC so a new user (not yet in business_user) can read
-- their pending invite + business name without hitting RLS on business table.
create or replace function public.get_my_pending_invite()
returns json as $$
declare
  v_phone text;
  v_invite public.invite;
  v_business_name text;
begin
  -- Get the caller's phone from auth.users
  select phone into v_phone
    from auth.users
    where id = auth.uid();

  if v_phone is null then
    return null;
  end if;

  -- Normalise: ensure leading +
  if left(v_phone, 1) <> '+' then
    v_phone := '+' || v_phone;
  end if;

  -- Find a pending, non-expired invite for this phone
  select * into v_invite
    from public.invite
    where phone = v_phone
      and status = 'pending'
      and expires_at > now()
    limit 1;

  if v_invite is null then
    return null;
  end if;

  -- Fetch business name
  select name into v_business_name
    from public.business
    where id = v_invite.business_id;

  return json_build_object(
    'id',            v_invite.id,
    'business_id',   v_invite.business_id,
    'branch_ids',    v_invite.branch_ids,
    'business_name', coalesce(v_business_name, '')
  );
end;
$$ language plpgsql security definer set search_path = public, auth;
