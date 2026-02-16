-- ============================================================
-- Add phone and status columns to invite table
-- ============================================================

-- Add phone column to store the invited person's phone number
alter table public.invite
  add column phone text not null default '';

-- Add status column to track invite lifecycle
create type public.invite_status as enum ('pending', 'accepted', 'rejected');

alter table public.invite
  add column status public.invite_status not null default 'pending';

-- Add index for fast phone lookup
create index idx_invite_phone_status on public.invite(phone, status);

-- Update invite table comment
comment on column public.invite.phone is 'Phone number of the invited user (with country code, e.g. +573001234567)';
comment on column public.invite.status is 'Status of the invite: pending, accepted, or rejected';
