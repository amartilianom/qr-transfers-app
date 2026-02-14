-- Enable UUID generation
create extension if not exists "uuid-ossp" with schema extensions;

-- ENUM for transfer provider
create type public.transfer_provider as enum ('nequi', 'daviplata', 'bancolombia');

-- ENUM for user role
create type public.user_role as enum ('admin', 'collaborator');

-- ============================================================
-- Business
-- ============================================================
create table public.business (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Branch
-- ============================================================
create table public.branch (
  id uuid primary key default extensions.uuid_generate_v4(),
  business_id uuid not null references public.business(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_branch_business on public.branch(business_id);

-- ============================================================
-- Business User (links auth.users to a business with a role)
-- ============================================================
create table public.business_user (
  id uuid primary key default extensions.uuid_generate_v4(),
  business_id uuid not null references public.business(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'collaborator',
  last_branch_id uuid references public.branch(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index idx_business_user_user on public.business_user(user_id);

-- ============================================================
-- Business User Branch (which branches a collaborator can access)
-- ============================================================
create table public.business_user_branch (
  id uuid primary key default extensions.uuid_generate_v4(),
  business_user_id uuid not null references public.business_user(id) on delete cascade,
  branch_id uuid not null references public.branch(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (business_user_id, branch_id)
);

create index idx_bub_business_user on public.business_user_branch(business_user_id);
create index idx_bub_branch on public.business_user_branch(branch_id);

-- ============================================================
-- Invite
-- ============================================================
create table public.invite (
  id uuid primary key default extensions.uuid_generate_v4(),
  business_id uuid not null references public.business(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  role public.user_role not null default 'collaborator',
  branch_ids uuid[] not null default '{}',
  token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  claimed_by uuid references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index idx_invite_token on public.invite(token);

-- ============================================================
-- Transfer
-- ============================================================
create table public.transfer (
  id uuid primary key default extensions.uuid_generate_v4(),
  branch_id uuid not null references public.branch(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  amount numeric(12,2) not null check (amount > 0),
  provider public.transfer_provider not null,
  transaction_id text,
  receipt_path text,
  occurred_at timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_transfer_branch on public.transfer(branch_id);
create index idx_transfer_occurred on public.transfer(occurred_at);
create index idx_transfer_txn_id on public.transfer(transaction_id) where transaction_id is not null;

-- ============================================================
-- Updated_at trigger
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_business_updated before update on public.business
  for each row execute function public.update_updated_at();

create trigger trg_branch_updated before update on public.branch
  for each row execute function public.update_updated_at();

create trigger trg_business_user_updated before update on public.business_user
  for each row execute function public.update_updated_at();

create trigger trg_transfer_updated before update on public.transfer
  for each row execute function public.update_updated_at();
