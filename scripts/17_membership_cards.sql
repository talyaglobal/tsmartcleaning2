-- Membership Cards (tSmartCard) schema
-- Creates: membership_cards, membership_transactions, membership_usage
-- Safe to re-run; uses IF NOT EXISTS

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- membership_cards
-- =========================
CREATE TABLE IF NOT EXISTS public.membership_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  
  -- Card details
  card_number TEXT NOT NULL UNIQUE, -- e.g., TSC-2024-012345
  card_number_masked TEXT NOT NULL, -- e.g., •••• •••• •••• 1234
  design_type TEXT NOT NULL DEFAULT 'purple' CHECK (design_type IN ('purple', 'black', 'rose', 'emerald', 'custom')),
  custom_image_url TEXT,
  
  -- Membership details
  tier TEXT NOT NULL DEFAULT 'premium' CHECK (tier IN ('basic', 'premium', 'pro', 'elite')),
  discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00, -- 10% for premium, 15% for pro, 20% for elite
  annual_cost DECIMAL(10, 2) NOT NULL DEFAULT 99.00,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'suspended')),
  is_activated BOOLEAN NOT NULL DEFAULT false,
  activation_code TEXT, -- For card activation flow
  activated_at TIMESTAMPTZ,
  
  -- Dates
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiration_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  
  -- Physical card
  physical_card_shipped BOOLEAN NOT NULL DEFAULT false,
  physical_card_delivered BOOLEAN NOT NULL DEFAULT false,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Usage tracking
  total_savings DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  order_count INTEGER NOT NULL DEFAULT 0,
  break_even_orders INTEGER, -- Calculated: annual_cost / (avg_order_amount * discount_percentage)
  
  -- Referral program
  referral_code TEXT UNIQUE,
  referral_count INTEGER NOT NULL DEFAULT 0,
  referral_credits DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Bonus credits
  bonus_credits DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  birthday_bonus_used BOOLEAN NOT NULL DEFAULT false,
  birthday_bonus_available_date DATE, -- Month and day when birthday bonus becomes available
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS membership_cards_user_id_idx ON public.membership_cards(user_id);
CREATE INDEX IF NOT EXISTS membership_cards_status_idx ON public.membership_cards(status);
CREATE INDEX IF NOT EXISTS membership_cards_referral_code_idx ON public.membership_cards(referral_code);
CREATE INDEX IF NOT EXISTS membership_cards_expiration_date_idx ON public.membership_cards(expiration_date);

-- =========================
-- membership_transactions
-- =========================
CREATE TABLE IF NOT EXISTS public.membership_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_card_id UUID NOT NULL REFERENCES public.membership_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'renewal', 'upgrade', 'refund', 'activation')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Payment details
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS membership_transactions_card_id_idx ON public.membership_transactions(membership_card_id);
CREATE INDEX IF NOT EXISTS membership_transactions_user_id_idx ON public.membership_transactions(user_id);

-- =========================
-- membership_usage
-- =========================
CREATE TABLE IF NOT EXISTS public.membership_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_card_id UUID NOT NULL REFERENCES public.membership_cards(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Usage details
  order_date TIMESTAMPTZ NOT NULL,
  service_name TEXT,
  original_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,
  
  -- Benefit used
  benefit_type TEXT, -- 'discount', 'free_upgrade', 'birthday_bonus', 'referral_credit', 'bonus_credit'
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS membership_usage_card_id_idx ON public.membership_usage(membership_card_id);
CREATE INDEX IF NOT EXISTS membership_usage_user_id_idx ON public.membership_usage(user_id);
CREATE INDEX IF NOT EXISTS membership_usage_booking_id_idx ON public.membership_usage(booking_id);
CREATE INDEX IF NOT EXISTS membership_usage_order_date_idx ON public.membership_usage(order_date);

-- =========================
-- Functions
-- =========================

-- Function to generate unique card number
CREATE OR REPLACE FUNCTION public.generate_card_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  card_num TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(card_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.membership_cards
  WHERE card_number LIKE 'TSC-' || year_part || '-%';
  
  card_num := 'TSC-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN card_num;
END;
$$;

-- Function to generate masked card number
CREATE OR REPLACE FUNCTION public.generate_masked_card_number(card_num TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  last_four TEXT;
BEGIN
  last_four := RIGHT(card_num, 4);
  RETURN '•••• •••• •••• ' || last_four;
END;
$$;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base code from user name (uppercase, alphanumeric only, max 10 chars)
  base_code := UPPER(REGEXP_REPLACE(COALESCE(user_name, 'USER'), '[^A-Z0-9]', '', 'g'));
  base_code := SUBSTRING(base_code FROM 1 FOR 10);
  base_code := base_code || TO_CHAR(NOW(), 'YYYY');
  
  final_code := base_code;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.membership_cards WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::TEXT;
  END LOOP;
  
  RETURN final_code;
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS membership_cards_set_updated_at ON public.membership_cards;
CREATE TRIGGER membership_cards_set_updated_at
BEFORE UPDATE ON public.membership_cards
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =========================
-- RLS Policies
-- =========================

ALTER TABLE public.membership_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_usage ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own membership card
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_cards' AND policyname = 'Allow read own card') THEN
    CREATE POLICY "Allow read own card" ON public.membership_cards
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_transactions' AND policyname = 'Allow read own transactions') THEN
    CREATE POLICY "Allow read own transactions" ON public.membership_transactions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_usage' AND policyname = 'Allow read own usage') THEN
    CREATE POLICY "Allow read own usage" ON public.membership_usage
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  -- Block direct writes from client; only service role should write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_cards' AND policyname = 'No client writes cards') THEN
    CREATE POLICY "No client writes cards" ON public.membership_cards
      FOR ALL USING (false) WITH CHECK (false);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_transactions' AND policyname = 'No client writes transactions') THEN
    CREATE POLICY "No client writes transactions" ON public.membership_transactions
      FOR ALL USING (false) WITH CHECK (false);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_usage' AND policyname = 'No client writes usage') THEN
    CREATE POLICY "No client writes usage" ON public.membership_usage
      FOR ALL USING (false) WITH CHECK (false);
  END IF;
END $$;

