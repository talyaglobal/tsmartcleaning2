-- Loyalty program schema
-- Creates: loyalty_accounts, loyalty_transactions, referrals, achievements, user_achievements
-- Assumes existing auth.users or users table provides user ids referenced here.

create table if not exists public.loyalty_accounts (
  user_id uuid primary key,
  points_balance integer not null default 0,
  tier text not null default 'Bronze', -- Bronze, Silver, Gold, Platinum
  tier_points_12m integer not null default 0,
  streak_count integer not null default 0,
  last_booking_at timestamptz,
  dob_month int2, -- 1-12
  dob_day int2,   -- 1-31
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  delta_points integer not null,
  source_type text not null, -- earn, redemption, refund, referral, milestone, badge, adjustment
  source_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists loyalty_transactions_user_id_idx on public.loyalty_transactions(user_id);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  referee_id uuid not null,
  status text not null default 'pending', -- pending, completed, rejected
  rewarded_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists referrals_unique_pair on public.referrals(referrer_id, referee_id);
create index if not exists referrals_referrer_idx on public.referrals(referrer_id);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  bonus_points integer not null default 0,
  once_per_user boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  user_id uuid not null,
  achievement_id uuid not null,
  awarded_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- Simple helper function to upsert loyalty account
create or replace function public.ensure_loyalty_account(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.loyalty_accounts(user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

-- Trigger for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists loyalty_accounts_set_updated_at on public.loyalty_accounts;
create trigger loyalty_accounts_set_updated_at
before update on public.loyalty_accounts
for each row execute procedure public.set_updated_at();

-- (Optional) RLS - adjust as needed. Disabled by default for service role usage.
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.referrals enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

do $$
begin
  -- Read-own policies for authenticated users
  if not exists (select 1 from pg_policies where tablename = 'loyalty_accounts' and policyname = 'Allow read own account') then
    create policy "Allow read own account" on public.loyalty_accounts
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'loyalty_transactions' and policyname = 'Allow read own transactions') then
    create policy "Allow read own transactions" on public.loyalty_transactions
      for select using (auth.uid() = user_id);
  end if;

  -- Block direct writes from client; only service role/serverless should write
  if not exists (select 1 from pg_policies where tablename = 'loyalty_accounts' and policyname = 'No client insert/update accounts') then
    create policy "No client insert/update accounts" on public.loyalty_accounts
      for all using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'loyalty_transactions' and policyname = 'No client writes transactions') then
    create policy "No client writes transactions" on public.loyalty_transactions
      for all using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'referrals' and policyname = 'No client writes referrals') then
    create policy "No client writes referrals" on public.referrals
      for all using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'achievements' and policyname = 'Allow public read achievements') then
    create policy "Allow public read achievements" on public.achievements
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_achievements' and policyname = 'Read own user_achievements') then
    create policy "Read own user_achievements" on public.user_achievements
      for select using (auth.uid() = user_id);
  end if;
end $$;


