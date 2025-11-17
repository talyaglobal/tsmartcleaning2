-- Custom domains for tenants: CNAME verification and optional ACME HTTP-01 support
-- Safe to run multiple times

CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostname TEXT UNIQUE NOT NULL, -- e.g., cleaning.example.com
  cname_token TEXT NOT NULL, -- random token for CNAME verification (_tsmart.<domain> -> <token>.<verify_domain>)
  status TEXT NOT NULL DEFAULT 'pending', -- pending|verified|disabled
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_domains_updated_at'
  ) THEN
    CREATE TRIGGER update_domains_updated_at
      BEFORE UPDATE ON public.domains
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_domains_tenant_id ON public.domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);

-- RLS policies:
-- Service-role (our backend) bypasses RLS. For anon/user access, keep restrictive.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domains' AND policyname='domains_no_select') THEN
    CREATE POLICY domains_no_select ON public.domains
      FOR SELECT
      TO authenticated, anon
      USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domains' AND policyname='domains_no_insert') THEN
    CREATE POLICY domains_no_insert ON public.domains
      FOR INSERT
      TO authenticated, anon
      WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domains' AND policyname='domains_no_update') THEN
    CREATE POLICY domains_no_update ON public.domains
      FOR UPDATE
      TO authenticated, anon
      USING (false)
      WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domains' AND policyname='domains_no_delete') THEN
    CREATE POLICY domains_no_delete ON public.domains
      FOR DELETE
      TO authenticated, anon
      USING (false);
  END IF;
END$$;

-- Optional: ACME HTTP-01 challenge storage for automated SSL (served via app route)
CREATE TABLE IF NOT EXISTS public.domain_acme_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT NOT NULL,
  token TEXT NOT NULL,
  key_authorization TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.domain_acme_challenges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domain_acme_challenges' AND policyname='acme_no_select') THEN
    CREATE POLICY acme_no_select ON public.domain_acme_challenges
      FOR SELECT TO authenticated, anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domain_acme_challenges' AND policyname='acme_no_write') THEN
    CREATE POLICY acme_no_write ON public.domain_acme_challenges
      FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
  END IF;
END$$;


