-- Minimal demo seed data for Supabase to replace mock UI data.
-- Safe to run multiple times. Aligns with created schema and multitenancy.
-- This focuses on: tenants, users (mapped from auth.users), provider profile,
-- addresses, provider availability, linking services, one sample booking,
-- optional review and transaction, and a sample insurance policy/claim if tables exist.

-- Ensure default tenant exists and capture its id
DO $$
DECLARE
  v_default_tenant_id UUID;
  v_customer_auth_id UUID;
  v_provider_auth_id UUID;
  v_customer_user_id UUID;
  v_provider_user_id UUID;
  v_provider_profile_id UUID;
  v_customer_address_id UUID;
  v_standard_service_id UUID;
  v_booking_id UUID;
  v_policy_id UUID;
  has_tenants BOOLEAN := false;
  has_users_tenant BOOLEAN := false;
  has_addresses_tenant BOOLEAN := false;
  has_provider_profiles_tenant BOOLEAN := false;
  has_services_tenant BOOLEAN := false;
  has_provider_services_tenant BOOLEAN := false;
  has_bookings_tenant BOOLEAN := false;
  has_reviews_tenant BOOLEAN := false;
  has_transactions_tenant BOOLEAN := false;
  has_provider_availability_tenant BOOLEAN := false;
  has_insurance_policies_tenant BOOLEAN := false;
  has_insurance_claims_tenant BOOLEAN := false;
BEGIN
  -- Detect tenants table and per-table tenant_id columns to support pre/post multitenancy
  has_tenants := (to_regclass('public.tenants') IS NOT NULL);
  IF has_tenants THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='users' AND column_name='tenant_id'
    ) INTO has_users_tenant;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='addresses' AND column_name='tenant_id'
    ) INTO has_addresses_tenant;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='provider_profiles' AND column_name='tenant_id'
    ) INTO has_provider_profiles_tenant;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='services' AND column_name='tenant_id'
    ) INTO has_services_tenant;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='provider_services' AND column_name='tenant_id'
    ) INTO has_provider_services_tenant;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='bookings' AND column_name='tenant_id'
    ) INTO has_bookings_tenant;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='reviews' AND column_name='tenant_id'
    ) INTO has_reviews_tenant;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='transactions' AND column_name='tenant_id'
    ) INTO has_transactions_tenant;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='provider_availability' AND column_name='tenant_id'
    ) INTO has_provider_availability_tenant;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='insurance_policies' AND column_name='tenant_id'
    ) INTO has_insurance_policies_tenant;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='insurance_claims' AND column_name='tenant_id'
    ) INTO has_insurance_claims_tenant;
  END IF;

  -- Create default tenant if missing (09_multitenancy.sql also ensures this)
  IF has_tenants THEN
    INSERT INTO public.tenants (slug, name)
    SELECT 'default', 'Default Tenant'
    WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'default');
    SELECT id INTO v_default_tenant_id FROM public.tenants WHERE slug = 'default';
  END IF;

  -- Map two demo auth users into public.users if available.
  -- If there are fewer than 2 auth users, this section will gracefully do nothing.
  IF to_regclass('auth.users') IS NOT NULL AND to_regclass('public.users') IS NOT NULL THEN
    -- Pick or create stable demo identities based on email if present
    SELECT id INTO v_customer_auth_id
    FROM auth.users
    WHERE email ILIKE '%demo.customer%@%' OR email ILIKE 'customer%@%'
    ORDER BY created_at
    LIMIT 1;

    IF v_customer_auth_id IS NULL THEN
      -- fallback: pick any auth user for demo customer
      SELECT id INTO v_customer_auth_id FROM auth.users ORDER BY created_at LIMIT 1;
    END IF;

    SELECT id INTO v_provider_auth_id
    FROM auth.users
    WHERE email ILIKE '%demo.provider%@%' OR email ILIKE 'provider%@%'
    AND id <> COALESCE(v_customer_auth_id, '00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY created_at
    LIMIT 1;

    IF v_provider_auth_id IS NULL THEN
      -- fallback: pick a different auth user if possible
      SELECT id INTO v_provider_auth_id
      FROM auth.users
      WHERE id <> COALESCE(v_customer_auth_id, '00000000-0000-0000-0000-000000000000'::uuid)
      ORDER BY created_at
      LIMIT 1;
    END IF;

    -- Insert corresponding public.users rows if missing
    IF v_customer_auth_id IS NOT NULL THEN
      IF has_users_tenant THEN
        INSERT INTO public.users (id, email, full_name, phone, role, tenant_id)
        SELECT au.id, COALESCE(au.email, 'customer@example.com'), COALESCE(au.raw_user_meta_data->>'full_name','Demo Customer'), NULL, 'customer', v_default_tenant_id
        FROM auth.users au
        WHERE au.id = v_customer_auth_id
        AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
      ELSE
        INSERT INTO public.users (id, email, full_name, phone, role)
        SELECT au.id, COALESCE(au.email, 'customer@example.com'), COALESCE(au.raw_user_meta_data->>'full_name','Demo Customer'), NULL, 'customer'
        FROM auth.users au
        WHERE au.id = v_customer_auth_id
        AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
      END IF;
      SELECT id INTO v_customer_user_id FROM public.users WHERE id = v_customer_auth_id;
    END IF;

    IF v_provider_auth_id IS NOT NULL THEN
      IF has_users_tenant THEN
        INSERT INTO public.users (id, email, full_name, phone, role, tenant_id)
        SELECT au.id, COALESCE(au.email, 'provider@example.com'), COALESCE(au.raw_user_meta_data->>'full_name','Demo Provider'), NULL, 'provider', v_default_tenant_id
        FROM auth.users au
        WHERE au.id = v_provider_auth_id
        AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
      ELSE
        INSERT INTO public.users (id, email, full_name, phone, role)
        SELECT au.id, COALESCE(au.email, 'provider@example.com'), COALESCE(au.raw_user_meta_data->>'full_name','Demo Provider'), NULL, 'provider'
        FROM auth.users au
        WHERE au.id = v_provider_auth_id
        AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
      END IF;
      SELECT id INTO v_provider_user_id FROM public.users WHERE id = v_provider_auth_id;
    END IF;
  END IF;

  -- Create provider profile tied to provider user
  IF to_regclass('public.provider_profiles') IS NOT NULL AND v_provider_user_id IS NOT NULL THEN
    IF has_provider_profiles_tenant THEN
      INSERT INTO public.provider_profiles (
        user_id, business_name, business_description, years_experience, service_radius,
        hourly_rate, is_verified, is_background_checked, is_insured, rating, total_reviews,
        total_bookings, total_earnings, availability_status, tenant_id
      )
      SELECT
        v_provider_user_id, 'Sparkle Pro Cleaning', 'Reliable residential and office cleaning.',
        5, 25, 45.00, true, true, true, 4.8, 12, 48, 7200.00, 'available', v_default_tenant_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.provider_profiles WHERE user_id = v_provider_user_id
      );
    ELSE
      INSERT INTO public.provider_profiles (
        user_id, business_name, business_description, years_experience, service_radius,
        hourly_rate, is_verified, is_background_checked, is_insured, rating, total_reviews,
        total_bookings, total_earnings, availability_status
      )
      SELECT
        v_provider_user_id, 'Sparkle Pro Cleaning', 'Reliable residential and office cleaning.',
        5, 25, 45.00, true, true, true, 4.8, 12, 48, 7200.00, 'available'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.provider_profiles WHERE user_id = v_provider_user_id
      );
    END IF;
    SELECT id INTO v_provider_profile_id FROM public.provider_profiles WHERE user_id = v_provider_user_id;
  END IF;

  -- Create a default address for the customer
  IF to_regclass('public.addresses') IS NOT NULL AND v_customer_user_id IS NOT NULL THEN
    IF has_addresses_tenant THEN
      INSERT INTO public.addresses (
        user_id, street_address, apt_suite, city, state, zip_code, is_default, tenant_id
      )
      SELECT v_customer_user_id, '123 Demo St', 'Apt 1', 'San Francisco', 'CA', '94107', true, v_default_tenant_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.addresses WHERE user_id = v_customer_user_id AND is_default = true
      );
    ELSE
      INSERT INTO public.addresses (
        user_id, street_address, apt_suite, city, state, zip_code, is_default
      )
      SELECT v_customer_user_id, '123 Demo St', 'Apt 1', 'San Francisco', 'CA', '94107', true
      WHERE NOT EXISTS (
        SELECT 1 FROM public.addresses WHERE user_id = v_customer_user_id AND is_default = true
      );
    END IF;
    SELECT id INTO v_customer_address_id FROM public.addresses WHERE user_id = v_customer_user_id AND is_default = true LIMIT 1;
  END IF;

  -- Ensure core services are present (03_seed_services.sql handles this too)
  IF to_regclass('public.services') IS NOT NULL THEN
    IF has_services_tenant THEN
      INSERT INTO public.services (name, description, category, base_price, unit, tenant_id)
      SELECT 'Standard House Cleaning', 'Regular cleaning including dusting, vacuuming, mopping, and bathroom cleaning', 'residential', 35.00, 'per_hour', v_default_tenant_id
      WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Standard House Cleaning');
    ELSE
      INSERT INTO public.services (name, description, category, base_price, unit)
      SELECT 'Standard House Cleaning', 'Regular cleaning including dusting, vacuuming, mopping, and bathroom cleaning', 'residential', 35.00, 'per_hour'
      WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Standard House Cleaning');
    END IF;

    SELECT id INTO v_standard_service_id FROM public.services WHERE name = 'Standard House Cleaning' LIMIT 1;
  END IF;

  -- Link provider to standard service
  IF to_regclass('public.provider_services') IS NOT NULL AND v_provider_profile_id IS NOT NULL AND v_standard_service_id IS NOT NULL THEN
    IF has_provider_services_tenant THEN
      INSERT INTO public.provider_services (provider_id, service_id, custom_price, tenant_id)
      SELECT v_provider_profile_id, v_standard_service_id, 42.00, v_default_tenant_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.provider_services WHERE provider_id = v_provider_profile_id AND service_id = v_standard_service_id
      );
    ELSE
      INSERT INTO public.provider_services (provider_id, service_id, custom_price)
      SELECT v_provider_profile_id, v_standard_service_id, 42.00
      WHERE NOT EXISTS (
        SELECT 1 FROM public.provider_services WHERE provider_id = v_provider_profile_id AND service_id = v_standard_service_id
      );
    END IF;
  END IF;

  -- Add basic weekly availability for provider (Mon-Fri 9-17)
  IF to_regclass('public.provider_availability') IS NOT NULL AND v_provider_profile_id IS NOT NULL THEN
    FOR i IN 1..5 LOOP
      IF has_provider_availability_tenant THEN
        INSERT INTO public.provider_availability (provider_id, day_of_week, start_time, end_time, is_available, tenant_id)
        SELECT v_provider_profile_id, i, '09:00'::time, '17:00'::time, true, v_default_tenant_id
        WHERE NOT EXISTS (
          SELECT 1 FROM public.provider_availability WHERE provider_id = v_provider_profile_id AND day_of_week = i
        );
      ELSE
        INSERT INTO public.provider_availability (provider_id, day_of_week, start_time, end_time, is_available)
        SELECT v_provider_profile_id, i, '09:00'::time, '17:00'::time, true
        WHERE NOT EXISTS (
          SELECT 1 FROM public.provider_availability WHERE provider_id = v_provider_profile_id AND day_of_week = i
        );
      END IF;
    END LOOP;
  END IF;

  -- Create a sample booking for tomorrow at 10:00
  IF to_regclass('public.bookings') IS NOT NULL
     AND v_customer_user_id IS NOT NULL
     AND v_customer_address_id IS NOT NULL
     AND v_standard_service_id IS NOT NULL THEN

    IF has_bookings_tenant THEN
      INSERT INTO public.bookings (
        customer_id, provider_id, service_id, address_id,
        booking_date, booking_time, duration_hours, property_size, bedrooms, bathrooms,
        special_instructions, subtotal, service_fee, tax, total_amount, status, payment_status,
        confirmed_at, tenant_id
      )
      SELECT
        v_customer_user_id,
        v_provider_profile_id,
        v_standard_service_id,
        v_customer_address_id,
        (CURRENT_DATE + INTERVAL '1 day')::date,
        '10:00'::time,
        3.0, 1200, 2, 1,
        'Please pay extra attention to the kitchen.',
        126.00, 9.00, 12.15, 147.15,
        'confirmed', 'paid',
        NOW(), v_default_tenant_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE customer_id = v_customer_user_id
          AND booking_date = (CURRENT_DATE + INTERVAL '1 day')::date
          AND booking_time = '10:00'::time
      )
      RETURNING id INTO v_booking_id;
    ELSE
      INSERT INTO public.bookings (
        customer_id, provider_id, service_id, address_id,
        booking_date, booking_time, duration_hours, property_size, bedrooms, bathrooms,
        special_instructions, subtotal, service_fee, tax, total_amount, status, payment_status,
        confirmed_at
      )
      SELECT
        v_customer_user_id,
        v_provider_profile_id,
        v_standard_service_id,
        v_customer_address_id,
        (CURRENT_DATE + INTERVAL '1 day')::date,
        '10:00'::time,
        3.0, 1200, 2, 1,
        'Please pay extra attention to the kitchen.',
        126.00, 9.00, 12.15, 147.15,
        'confirmed', 'paid',
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE customer_id = v_customer_user_id
          AND booking_date = (CURRENT_DATE + INTERVAL '1 day')::date
          AND booking_time = '10:00'::time
      )
      RETURNING id INTO v_booking_id;
    END IF;

    -- If the row already existed, fetch its id for downstream demo inserts
    IF v_booking_id IS NULL THEN
      SELECT id INTO v_booking_id
      FROM public.bookings
      WHERE customer_id = v_customer_user_id
        AND booking_date = (CURRENT_DATE + INTERVAL '1 day')::date
        AND booking_time = '10:00'::time
      LIMIT 1;
    END IF;
  END IF;

  -- Optional: create a review and transaction for the sample booking
  IF v_booking_id IS NOT NULL THEN
    IF to_regclass('public.reviews') IS NOT NULL AND v_provider_profile_id IS NOT NULL THEN
      IF has_reviews_tenant THEN
        INSERT INTO public.reviews (
          booking_id, customer_id, provider_id, rating, comment, tenant_id
        )
        SELECT v_booking_id, v_customer_user_id, v_provider_profile_id, 5, 'Fantastic job! Highly recommend.', v_default_tenant_id
        WHERE NOT EXISTS (SELECT 1 FROM public.reviews WHERE booking_id = v_booking_id);
      ELSE
        INSERT INTO public.reviews (
          booking_id, customer_id, provider_id, rating, comment
        )
        SELECT v_booking_id, v_customer_user_id, v_provider_profile_id, 5, 'Fantastic job! Highly recommend.'
        WHERE NOT EXISTS (SELECT 1 FROM public.reviews WHERE booking_id = v_booking_id);
      END IF;
    END IF;

    IF to_regclass('public.transactions') IS NOT NULL THEN
      IF has_transactions_tenant THEN
        INSERT INTO public.transactions (
          booking_id, customer_id, provider_id, amount, platform_fee, provider_payout,
          transaction_type, payment_method, status, tenant_id
        )
        SELECT v_booking_id, v_customer_user_id, v_provider_profile_id, 147.15, 14.72, 132.43,
               'payment', 'card', 'completed', v_default_tenant_id
        WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE booking_id = v_booking_id AND transaction_type = 'payment');
      ELSE
        INSERT INTO public.transactions (
          booking_id, customer_id, provider_id, amount, platform_fee, provider_payout,
          transaction_type, payment_method, status
        )
        SELECT v_booking_id, v_customer_user_id, v_provider_profile_id, 147.15, 14.72, 132.43,
               'payment', 'card', 'completed'
        WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE booking_id = v_booking_id AND transaction_type = 'payment');
      END IF;
    END IF;
  END IF;

  -- Optional: seed one active insurance policy and a simple claim for the customer if tables exist
  IF to_regclass('public.insurance_plans') IS NOT NULL
     AND to_regclass('public.insurance_policies') IS NOT NULL
     AND v_customer_user_id IS NOT NULL THEN
    -- ensure at least one plan exists (12_insurance.sql also seeds)
    PERFORM 1 FROM public.insurance_plans;
    -- choose any plan
    SELECT id INTO v_policy_id FROM public.insurance_policies WHERE user_id = v_customer_user_id LIMIT 1;
    IF v_policy_id IS NULL THEN
      IF has_insurance_policies_tenant THEN
        INSERT INTO public.insurance_policies (user_id, tenant_id, plan_id, policy_number, status, effective_date, expiration_date, billing_cycle)
        SELECT v_customer_user_id,
               COALESCE(v_default_tenant_id::text, NULL),
               (SELECT id FROM public.insurance_plans ORDER BY monthly_price LIMIT 1),
               'POL-' || FLOOR(EXTRACT(EPOCH FROM NOW()))::text,
               'active',
               CURRENT_DATE,
               CURRENT_DATE + INTERVAL '1 year',
               'annual'
        RETURNING id INTO v_policy_id;
      ELSE
        INSERT INTO public.insurance_policies (user_id, plan_id, policy_number, status, effective_date, expiration_date, billing_cycle)
        SELECT v_customer_user_id,
               (SELECT id FROM public.insurance_plans ORDER BY monthly_price LIMIT 1),
               'POL-' || FLOOR(EXTRACT(EPOCH FROM NOW()))::text,
               'active',
               CURRENT_DATE,
               CURRENT_DATE + INTERVAL '1 year',
               'annual'
        RETURNING id INTO v_policy_id;
      END IF;
    END IF;

    IF to_regclass('public.insurance_claims') IS NOT NULL AND v_policy_id IS NOT NULL THEN
      IF has_insurance_claims_tenant THEN
        INSERT INTO public.insurance_claims (
          policy_id, user_id, tenant_id, claim_code, incident_type, incident_date, incident_time, description, amount_claimed, status
        )
        SELECT v_policy_id, v_customer_user_id, COALESCE(v_default_tenant_id::text, NULL),
               'CLM-' || FLOOR(EXTRACT(EPOCH FROM NOW()))::text,
               'property_damage', CURRENT_DATE - INTERVAL '10 days', '14:30',
               'Minor scratch on hardwood floor during cleaning.', 250.00, 'under_review'
        WHERE NOT EXISTS (
          SELECT 1 FROM public.insurance_claims WHERE policy_id = v_policy_id
        );
      ELSE
        INSERT INTO public.insurance_claims (
          policy_id, user_id, claim_code, incident_type, incident_date, incident_time, description, amount_claimed, status
        )
        SELECT v_policy_id, v_customer_user_id,
               'CLM-' || FLOOR(EXTRACT(EPOCH FROM NOW()))::text,
               'property_damage', CURRENT_DATE - INTERVAL '10 days', '14:30',
               'Minor scratch on hardwood floor during cleaning.', 250.00, 'under_review'
        WHERE NOT EXISTS (
          SELECT 1 FROM public.insurance_claims WHERE policy_id = v_policy_id
        );
      END IF;
    END IF;
  END IF;
END$$;

-- Safe to run multiple times.
-- UUID-safe: derives IDs from existing rows or inserts conditionally.

-- 1) Upsert tenant by slug (slug is UNIQUE in schema)
INSERT INTO public.tenants (name, slug)
VALUES ('Demo Tenant', 'demo')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 2) Create public.users for existing auth users by email (no-op if not present)
INSERT INTO public.users (id, email, full_name, role)
SELECT id, 'info@tsmart.ai', 'Customer One', 'customer'
FROM auth.users
WHERE email = 'info@tsmart.ai'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role)
SELECT id, 'info@talyaglobal.com', 'Provider One', 'provider'
FROM auth.users
WHERE email = 'info@talyaglobal.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role)
SELECT id, 'volkan@tsmart.ai', 'Admin One', 'admin'
FROM auth.users
WHERE email = 'volkan@tsmart.ai'
ON CONFLICT (id) DO NOTHING;

-- 3) Ensure a basic service exists; services.name is NOT unique, so use insert-if-not-exists
INSERT INTO public.services (name, description, category, base_price, unit)
SELECT 'Standard Cleaning', NULL, 'residential', 120, 'per_hour'
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Standard Cleaning');

-- 5) Provider profile (linked to provider's public.users id)
INSERT INTO public.provider_profiles (user_id, business_name, is_verified, created_at)
SELECT u.id, 'Clean Pro Services', true, now()
FROM public.users u
WHERE u.email = 'info@talyaglobal.com'
ON CONFLICT (user_id) DO NOTHING;

-- 6) Map tenant membership (user_tenants)
INSERT INTO public.user_tenants (user_id, tenant_id, role, created_at)
SELECT u.id, t.id, 'owner', now()
FROM public.users u
JOIN public.tenants t ON t.slug = 'demo'
WHERE u.email = 'volkan@tsmart.ai'
ON CONFLICT (user_id, tenant_id) DO NOTHING;

INSERT INTO public.user_tenants (user_id, tenant_id, role, created_at)
SELECT u.id, t.id, 'member', now()
FROM public.users u
JOIN public.tenants t ON t.slug = 'demo'
WHERE u.email = 'info@talyaglobal.com'
ON CONFLICT (user_id, tenant_id) DO NOTHING;

INSERT INTO public.user_tenants (user_id, tenant_id, role, created_at)
SELECT u.id, t.id, 'member', now()
FROM public.users u
JOIN public.tenants t ON t.slug = 'demo'
WHERE u.email = 'info@tsmart.ai'
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- NOTE:
-- Bookings, transactions, notifications, etc. are omitted here due to strict UUID FKs
-- (e.g., address_id, provider_profile IDs). Seed them separately with valid UUIDs
-- once prerequisite rows exist in your environment.


