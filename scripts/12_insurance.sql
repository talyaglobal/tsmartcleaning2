-- Insurance add-on schema
-- Plans, policies, claims, documents, payments, activities, high-value items

create table if not exists public.insurance_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code in ('basic','premium','ultimate')),
  name text not null,
  monthly_price numeric(10,2) not null,
  annual_price numeric(10,2) not null,
  property_damage_limit numeric(12,2) not null,
  theft_limit numeric(12,2),
  liability_limit numeric(12,2) not null,
  key_replacement_limit numeric(12,2),
  emergency_cleans_per_year int default 0,
  deductible numeric(10,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tenant_id text,
  plan_id uuid not null references public.insurance_plans(id),
  policy_number text unique not null,
  status text not null check (status in ('draft','active','pending_activation','cancelled','expired')),
  effective_date date,
  expiration_date date,
  auto_renew boolean default true,
  billing_cycle text not null default 'annual' check (billing_cycle in ('monthly','annual')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.insurance_policies(id),
  user_id uuid not null,
  tenant_id text,
  claim_code text unique not null,
  incident_type text not null,
  incident_date date not null,
  incident_time text,
  description text not null,
  amount_claimed numeric(12,2),
  status text not null default 'filed' check (status in ('filed','under_review','adjuster_assigned','approved','denied','paid','withdrawn')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.insurance_claim_documents (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.insurance_claims(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  content_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);

create table if not exists public.insurance_payments (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.insurance_policies(id),
  user_id uuid not null,
  cycle text not null check (cycle in ('monthly','annual')),
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  paid_at timestamptz,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz default now()
);

create table if not exists public.insurance_claim_activities (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.insurance_claims(id) on delete cascade,
  actor text not null,
  message text not null,
  created_at timestamptz default now()
);

create table if not exists public.insurance_high_value_items (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.insurance_policies(id),
  title text not null,
  description text,
  estimated_value numeric(12,2),
  photo_url text,
  created_at timestamptz default now()
);

-- Useful indexes
create index if not exists idx_ins_policies_user on public.insurance_policies(user_id);
create index if not exists idx_ins_claims_user on public.insurance_claims(user_id);
create index if not exists idx_ins_claims_policy on public.insurance_claims(policy_id);

-- Seed default plans if empty
insert into public.insurance_plans (code, name, monthly_price, annual_price, property_damage_limit, theft_limit, liability_limit, key_replacement_limit, emergency_cleans_per_year, deductible)
select * from (values
  ('basic','Basic', 9.99, 95.90, 5000, null, 50000, 200, 0, 100),
  ('premium','Premium', 19.99, 191.90, 25000, 10000, 500000, 500, 1, 50),
  ('ultimate','Ultimate', 34.99, 335.90, 100000, 50000, 2000000, 1000, 4, 0)
) as v(code,name,monthly_price,annual_price,property_damage_limit,theft_limit,liability_limit,key_replacement_limit,emergency_cleans_per_year,deductible)
where not exists (select 1 from public.insurance_plans);


