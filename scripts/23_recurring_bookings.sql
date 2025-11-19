-- Recurring bookings support
-- This migration adds support for recurring bookings

-- Create recurring_bookings table FIRST (before adding foreign key references)
CREATE TABLE IF NOT EXISTS public.recurring_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.provider_profiles(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  address_id UUID NOT NULL REFERENCES public.addresses(id) ON DELETE RESTRICT,
  
  -- Recurrence pattern
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31), -- For monthly
  booking_time TIME NOT NULL,
  duration_hours DECIMAL(4, 2) NOT NULL,
  
  -- Pricing (can be overridden per instance)
  subtotal DECIMAL(10, 2) NOT NULL,
  service_fee DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  
  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means no end date
  next_booking_date DATE, -- Next scheduled booking date
  
  -- Special instructions
  special_instructions TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Add recurring booking fields to bookings table (after recurring_bookings table exists)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS recurring_booking_id UUID,
ADD COLUMN IF NOT EXISTS is_recurring_instance BOOLEAN DEFAULT false;

-- Add foreign key constraint after both columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_recurring_booking_id_fkey'
  ) THEN
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_recurring_booking_id_fkey
    FOREIGN KEY (recurring_booking_id) REFERENCES public.recurring_bookings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for recurring bookings lookups
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_tenant_id ON public.recurring_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_customer_id ON public.recurring_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_status ON public.recurring_bookings(status);
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_next_date ON public.recurring_bookings(next_booking_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_bookings_recurring_id ON public.bookings(recurring_booking_id);

-- Add tenant_id to recurring_bookings if not exists (should be handled by multitenancy migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'recurring_bookings' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.recurring_bookings ADD COLUMN tenant_id UUID;
  END IF;
END $$;

-- Enable RLS on recurring_bookings
ALTER TABLE public.recurring_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_bookings
CREATE POLICY "Users can view their own recurring bookings"
  ON public.recurring_bookings FOR SELECT
  USING (
    auth.uid() = customer_id OR
    auth.uid() IN (SELECT user_id FROM public.provider_profiles WHERE id = provider_id)
  );

CREATE POLICY "Users can create their own recurring bookings"
  ON public.recurring_bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own recurring bookings"
  ON public.recurring_bookings FOR UPDATE
  USING (
    auth.uid() = customer_id OR
    auth.uid() IN (SELECT user_id FROM public.provider_profiles WHERE id = provider_id)
  );

CREATE POLICY "Users can delete their own recurring bookings"
  ON public.recurring_bookings FOR DELETE
  USING (auth.uid() = customer_id);

-- Function to calculate next booking date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_recurring_date(
  p_frequency TEXT,
  p_start_date DATE,
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_current_date DATE DEFAULT CURRENT_DATE
) RETURNS DATE AS $$
DECLARE
  next_date DATE;
  current_weekday INTEGER;
  days_to_add INTEGER;
BEGIN
  next_date := p_current_date;
  
  CASE p_frequency
    WHEN 'weekly' THEN
      -- Find next occurrence of the specified day of week
      current_weekday := EXTRACT(DOW FROM next_date);
      days_to_add := (p_day_of_week - current_weekday + 7) % 7;
      IF days_to_add = 0 THEN
        days_to_add := 7; -- If today is the day, schedule for next week
      END IF;
      next_date := next_date + (days_to_add || ' days')::INTERVAL;
      
    WHEN 'biweekly' THEN
      -- Find next occurrence, then add 2 weeks
      current_weekday := EXTRACT(DOW FROM next_date);
      days_to_add := (p_day_of_week - current_weekday + 7) % 7;
      IF days_to_add = 0 THEN
        days_to_add := 14; -- If today is the day, schedule for 2 weeks from now
      ELSE
        days_to_add := days_to_add + 7; -- Add a week to get to biweekly
      END IF;
      next_date := next_date + (days_to_add || ' days')::INTERVAL;
      
    WHEN 'monthly' THEN
      -- Find next occurrence of the day of month
      IF p_day_of_month IS NULL THEN
        -- Use the day of month from start_date
        next_date := DATE_TRUNC('month', next_date) + (EXTRACT(DAY FROM p_start_date) - 1 || ' days')::INTERVAL;
        IF next_date <= p_current_date THEN
          next_date := next_date + '1 month'::INTERVAL;
        END IF;
      ELSE
        next_date := DATE_TRUNC('month', next_date) + (p_day_of_month - 1 || ' days')::INTERVAL;
        IF next_date <= p_current_date THEN
          next_date := next_date + '1 month'::INTERVAL;
        END IF;
        -- Handle months with fewer days (e.g., Feb 31 -> Feb 28/29)
        IF EXTRACT(DAY FROM next_date) < p_day_of_month THEN
          next_date := DATE_TRUNC('month', next_date) + (EXTRACT(DAY FROM (DATE_TRUNC('month', next_date) + '1 month'::INTERVAL - '1 day'::INTERVAL)) || ' days')::INTERVAL;
        END IF;
      END IF;
      
    ELSE
      RETURN NULL;
  END CASE;
  
  RETURN next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

