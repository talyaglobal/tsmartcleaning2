-- Revenue Share Rules - Basic storage
-- Creates a flexible rules table with hierarchical matching capabilities.
-- This is a basic schema intended to support tenant/provider/service/territory-specific overrides.

create table if not exists public.revenue_share_rules (
  id uuid primary key default gen_random_uuid(),
  -- Multi-tenancy scoping (nullable means global rule)
  tenant_id uuid references public.tenants(id) on delete cascade,
  -- Optional scoping dimensions for specificity
  provider_id uuid references public.providers(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  territory_id uuid references public.territories(id) on delete set null,
  -- Financials
  platform_percent numeric(5,2) not null check (platform_percent >= 0 and platform_percent <= 100),
  processing_fee_fixed_cents integer not null default 30 check (processing_fee_fixed_cents >= 0),
  minimum_payout_cents integer not null default 2000 check (minimum_payout_cents >= 0),
  -- Rule control
  priority integer not null default 0,
  active boolean not null default true,
  valid_from timestamptz default now(),
  valid_to timestamptz,
  -- Metadata
  name text,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists idx_revenue_share_rules_active_time
  on public.revenue_share_rules (active, valid_from, valid_to);

create index if not exists idx_revenue_share_rules_scope
  on public.revenue_share_rules (tenant_id, provider_id, service_id, territory_id, priority);

-- Optional: simple default rule if none exist
insert into public.revenue_share_rules (name, platform_percent, processing_fee_fixed_cents, minimum_payout_cents, priority, active)
select 'Global default 15% platform / $0.30 processing', 15.00, 30, 2000, 0, true
where not exists (select 1 from public.revenue_share_rules);


