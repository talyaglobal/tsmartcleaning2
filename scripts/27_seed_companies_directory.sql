-- Seed data for cleaning companies directory (find-cleaners page)
-- This script adds missing columns to the companies table and inserts sample data
-- Safe to run multiple times (uses IF NOT EXISTS and handles duplicates)

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Add missing columns to companies table if they don't exist
-- =========================
DO $$
BEGIN
  -- Add company_name (display name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='company_name'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN company_name TEXT;
  END IF;

  -- Add legal_name (registered business name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='legal_name'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN legal_name TEXT;
  END IF;

  -- Add slug (URL-friendly identifier)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='slug'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN slug TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug) WHERE slug IS NOT NULL;
  END IF;

  -- Add country
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='country'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN country TEXT DEFAULT 'US';
  END IF;

  -- Add latitude and longitude for geolocation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='latitude'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN latitude DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='longitude'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN longitude DECIMAL(11, 8);
  END IF;

  -- Add rating fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='average_rating'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN average_rating DECIMAL(3, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='total_reviews'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN total_reviews INTEGER DEFAULT 0;
  END IF;

  -- Add verification and featured status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='verified'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='featured'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;

  -- Add price range
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='price_range'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$'));
  END IF;

  -- Add tagline (short description)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='tagline'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN tagline TEXT;
  END IF;

  -- Add logo and cover image URLs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='logo_url'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN logo_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='cover_image_url'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN cover_image_url TEXT;
  END IF;

  -- Add domain (for custom domains feature)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='companies' AND column_name='domain'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN domain TEXT;
  END IF;

  -- Create indexes for search performance
  CREATE INDEX IF NOT EXISTS idx_companies_latitude_longitude ON public.companies(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_companies_city_state ON public.companies(city, state) WHERE city IS NOT NULL AND state IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_companies_average_rating ON public.companies(average_rating) WHERE average_rating IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_companies_verified ON public.companies(verified) WHERE verified = true;
  CREATE INDEX IF NOT EXISTS idx_companies_featured ON public.companies(featured) WHERE featured = true;
END$$;

-- =========================
-- Get default tenant ID
-- =========================
DO $$
DECLARE
  v_default_tenant_id UUID;
BEGIN
  -- Get or create default tenant
  IF to_regclass('public.tenants') IS NOT NULL THEN
    INSERT INTO public.tenants (slug, name)
    SELECT 'default', 'Default Tenant'
    WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'default');
    
    SELECT id INTO v_default_tenant_id FROM public.tenants WHERE slug = 'default';
  END IF;

  -- =========================
  -- Insert seed companies (diverse locations across US and Canada)
  -- =========================

  -- Only insert if companies don't already exist (by slug)
  -- Delete existing seed data first to avoid duplicates
  DELETE FROM public.companies WHERE slug LIKE 'demo-%' OR slug IN (
    'sparkle-clean-nyc',
    'pristine-maid-services-los-angeles',
    'eco-clean-chicago',
    'premier-cleaning-toronto',
    'shine-bright-miami',
    'spotless-pro-seattle',
    'crystal-clean-dallas',
    'fresh-home-cleaning-vancouver',
    'green-clean-denver',
    'elite-cleaning-services-phoenix',
    'texas-clean-co-houston',
    'boston-sparkle',
    'bay-area-clean-san-francisco',
    'propre-montreal',
    'peach-state-cleaning-atlanta',
    'eco-friendly-clean-portland',
    'vegas-elite-cleaning',
    'capital-clean-services-dc',
    'rocky-mountain-clean-calgary',
    'keep-austin-clean',
    'city-of-brotherly-clean-philadelphia'
  );

  -- New York City, NY
  INSERT INTO public.companies (
    tenant_id, name, company_name, legal_name, slug, city, state, country, address, zip_code,
    latitude, longitude, description, tagline, average_rating, total_reviews, verified, featured,
    price_range, logo_url, cover_image_url, phone, email, website, status
  ) VALUES
  (
    v_default_tenant_id,
    'Sparkle Clean NYC',
    'Sparkle Clean NYC',
    'Sparkle Clean NYC LLC',
    'sparkle-clean-nyc',
    'New York',
    'NY',
    'US',
    '123 Broadway',
    '10001',
    40.7128, -74.0060,
    'Professional residential and commercial cleaning services in Manhattan and surrounding areas. We provide eco-friendly solutions with fully insured and background-checked cleaners.',
    'Making NYC shine, one space at a time',
    4.8,
    247,
    true,
    true,
    '$$$',
    NULL,
    NULL,
    '+1-212-555-0100',
    'info@sparklecleannyc.com',
    'https://sparklecleannyc.com',
    'active'
  ),

  -- Los Angeles, CA
  (
    v_default_tenant_id,
    'Pristine Maid Services',
    'Pristine Maid Services',
    'Pristine Maid Services Inc.',
    'pristine-maid-services-los-angeles',
    'Los Angeles',
    'CA',
    'US',
    '456 Sunset Blvd',
    '90028',
    34.0522, -118.2437,
    'Premium cleaning services for homes and offices throughout Los Angeles County. Specializing in deep cleaning, move-in/out cleaning, and recurring maintenance.',
    'Your trusted cleaning partner in LA',
    4.7,
    189,
    true,
    true,
    '$$',
    NULL,
    NULL,
    '+1-323-555-0200',
    'hello@pristinemaidsla.com',
    NULL,
    'active'
  ),

  -- Chicago, IL
  (
    v_default_tenant_id,
    'Eco Clean Chicago',
    'Eco Clean Chicago',
    'Eco Clean Chicago LLC',
    'eco-clean-chicago',
    'Chicago',
    'IL',
    'US',
    '789 Michigan Ave',
    '60611',
    41.8781, -87.6298,
    'Environmentally-friendly cleaning services using only green-certified products. Serving the greater Chicago area with a focus on health and sustainability.',
    'Green cleaning for a healthier Chicago',
    4.6,
    156,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-312-555-0300',
    'contact@ecocleanchicago.com',
    NULL,
    'active'
  ),

  -- Toronto, ON, Canada
  (
    v_default_tenant_id,
    'Premier Cleaning Toronto',
    'Premier Cleaning Toronto',
    'Premier Cleaning Services Ltd.',
    'premier-cleaning-toronto',
    'Toronto',
    'ON',
    'CA',
    '100 Queen Street',
    'M5H 2N2',
    43.6532, -79.3832,
    'Top-rated commercial and residential cleaning company serving the Greater Toronto Area. Professional, reliable, and fully bonded cleaners.',
    'Excellence in every detail',
    4.9,
    312,
    true,
    true,
    '$$$',
    NULL,
    NULL,
    '+1-416-555-0400',
    'info@premiercleaningtoronto.ca',
    NULL,
    'active'
  ),

  -- Miami, FL
  (
    v_default_tenant_id,
    'Shine Bright Miami',
    'Shine Bright Miami',
    'Shine Bright Cleaning Services Inc.',
    'shine-bright-miami',
    'Miami',
    'FL',
    'US',
    '321 Ocean Drive',
    '33139',
    25.7617, -80.1918,
    'Full-service residential cleaning in Miami-Dade County. We offer flexible scheduling, same-day service options, and satisfaction guaranteed.',
    'Bringing the shine to South Beach',
    4.5,
    134,
    true,
    false,
    '$',
    NULL,
    NULL,
    '+1-305-555-0500',
    'service@shinebrightmiami.com',
    NULL,
    'active'
  ),

  -- Seattle, WA
  (
    v_default_tenant_id,
    'Spotless Pro Seattle',
    'Spotless Pro Seattle',
    'Spotless Professional Cleaning LLC',
    'spotless-pro-seattle',
    'Seattle',
    'WA',
    'US',
    '555 Pike Street',
    '98101',
    47.6062, -122.3321,
    'Professional cleaning services for homes and businesses in the Seattle metro area. Specializing in post-construction cleanup and regular maintenance.',
    'Professional cleaning, exceptional results',
    4.7,
    201,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-206-555-0600',
    'info@spotlessproseattle.com',
    NULL,
    'active'
  ),

  -- Dallas, TX
  (
    v_default_tenant_id,
    'Crystal Clean Dallas',
    'Crystal Clean Dallas',
    'Crystal Clean Services LLC',
    'crystal-clean-dallas',
    'Dallas',
    'TX',
    'US',
    '888 Commerce Street',
    '75202',
    32.7767, -96.7970,
    'Trusted cleaning company serving Dallas-Fort Worth metroplex. We provide comprehensive cleaning solutions with attention to detail and competitive pricing.',
    'Crystal clear results, every time',
    4.4,
    98,
    true,
    false,
    '$',
    NULL,
    NULL,
    '+1-214-555-0700',
    'hello@crystalcleandallas.com',
    NULL,
    'active'
  ),

  -- Vancouver, BC, Canada
  (
    v_default_tenant_id,
    'Fresh Home Cleaning',
    'Fresh Home Cleaning',
    'Fresh Home Cleaning Services Inc.',
    'fresh-home-cleaning-vancouver',
    'Vancouver',
    'BC',
    'CA',
    '200 Granville Street',
    'V6C 1S4',
    49.2827, -123.1207,
    'Residential cleaning specialists serving Vancouver and surrounding areas. Eco-friendly products, flexible scheduling, and exceptional customer service.',
    'Fresh, clean homes you can trust',
    4.8,
    167,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-604-555-0800',
    'info@freshhomevancouver.ca',
    NULL,
    'active'
  ),

  -- Denver, CO
  (
    v_default_tenant_id,
    'Green Clean Denver',
    'Green Clean Denver',
    'Green Clean Denver LLC',
    'green-clean-denver',
    'Denver',
    'CO',
    'US',
    '444 16th Street',
    '80202',
    39.7392, -104.9903,
    'Eco-conscious cleaning company serving Denver metro. We use only non-toxic, plant-based cleaning products that are safe for your family and pets.',
    'Clean green, live well',
    4.6,
    142,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-303-555-0900',
    'contact@greencleandenver.com',
    NULL,
    'active'
  ),

  -- Phoenix, AZ
  (
    v_default_tenant_id,
    'Elite Cleaning Services',
    'Elite Cleaning Services',
    'Elite Cleaning Services Inc.',
    'elite-cleaning-services-phoenix',
    'Phoenix',
    'AZ',
    'US',
    '777 North Central Avenue',
    '85004',
    33.4484, -112.0740,
    'Premium cleaning services for luxury homes and high-end offices in Phoenix and Scottsdale. White-glove service with attention to every detail.',
    'Elite service for elite spaces',
    4.9,
    89,
    true,
    true,
    '$$$$',
    NULL,
    NULL,
    '+1-602-555-1000',
    'info@elitecleaningphoenix.com',
    NULL,
    'active'
  ),

  -- Houston, TX (additional company)
  (
    v_default_tenant_id,
    'Texas Clean Co',
    'Texas Clean Co',
    'Texas Clean Company LLC',
    'texas-clean-co-houston',
    'Houston',
    'TX',
    'US',
    '999 Main Street',
    '77002',
    29.7604, -95.3698,
    'Reliable residential and commercial cleaning throughout Houston. Competitive rates, experienced cleaners, and flexible service options.',
    'Keeping Texas clean and proud',
    4.3,
    76,
    false,
    false,
    '$',
    NULL,
    NULL,
    '+1-713-555-1100',
    'service@texascleanco.com',
    NULL,
    'active'
  ),

  -- Boston, MA
  (
    v_default_tenant_id,
    'Boston Sparkle',
    'Boston Sparkle',
    'Boston Sparkle Cleaning LLC',
    'boston-sparkle',
    'Boston',
    'MA',
    'US',
    '111 Newbury Street',
    '02116',
    42.3601, -71.0589,
    'Professional cleaning services for homes and offices in Boston and surrounding suburbs. Experienced team with excellent customer reviews.',
    'Making Boston shine since 2015',
    4.7,
    203,
    true,
    false,
    '$$$',
    NULL,
    NULL,
    '+1-617-555-1200',
    'hello@bostonsparkle.com',
    NULL,
    'active'
  ),

  -- San Francisco, CA
  (
    v_default_tenant_id,
    'Bay Area Clean',
    'Bay Area Clean',
    'Bay Area Clean Services Inc.',
    'bay-area-clean-san-francisco',
    'San Francisco',
    'CA',
    'US',
    '222 Market Street',
    '94102',
    37.7749, -122.4194,
    'Comprehensive cleaning solutions for the San Francisco Bay Area. Serving residential and commercial clients with eco-friendly practices.',
    'Clean spaces, better living',
    4.5,
    145,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-415-555-1300',
    'info@bayareaclean.com',
    NULL,
    'active'
  ),

  -- Montreal, QC, Canada
  (
    v_default_tenant_id,
    'Propre Montreal',
    'Propre Montreal',
    'Services de Nettoyage Propre Montreal Inc.',
    'propre-montreal',
    'Montreal',
    'QC',
    'CA',
    '333 Sainte-Catherine Street',
    'H3B 1B9',
    45.5017, -73.5673,
    'Services de nettoyage résidentiel et commercial à Montréal. Équipe professionnelle, produits écologiques et satisfaction garantie.',
    'Votre espace, notre expertise',
    4.6,
    178,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-514-555-1400',
    'info@propremontreal.ca',
    NULL,
    'active'
  ),

  -- Atlanta, GA
  (
    v_default_tenant_id,
    'Peach State Cleaning',
    'Peach State Cleaning',
    'Peach State Cleaning Services LLC',
    'peach-state-cleaning-atlanta',
    'Atlanta',
    'GA',
    'US',
    '444 Peachtree Street',
    '30309',
    33.7490, -84.3880,
    'Trusted cleaning services throughout the Atlanta metro area. Affordable rates, reliable service, and satisfaction guaranteed on every job.',
    'Serving Atlanta with pride',
    4.4,
    112,
    false,
    false,
    '$',
    NULL,
    NULL,
    '+1-404-555-1500',
    'contact@peachstatecleaning.com',
    NULL,
    'active'
  ),

  -- Portland, OR
  (
    v_default_tenant_id,
    'Eco-Friendly Clean Portland',
    'Eco-Friendly Clean Portland',
    'Eco-Friendly Clean Portland LLC',
    'eco-friendly-clean-portland',
    'Portland',
    'OR',
    'US',
    '555 SW Broadway',
    '97205',
    45.5152, -122.6784,
    '100% eco-friendly cleaning services in Portland. We use only natural, non-toxic products and sustainable practices for a healthier home.',
    'Clean green, think Portland',
    4.8,
    156,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-503-555-1600',
    'hello@ecofriendlycleanpdx.com',
    NULL,
    'active'
  ),

  -- Las Vegas, NV
  (
    v_default_tenant_id,
    'Vegas Elite Cleaning',
    'Vegas Elite Cleaning',
    'Vegas Elite Cleaning Services Inc.',
    'vegas-elite-cleaning',
    'Las Vegas',
    'NV',
    'US',
    '666 Las Vegas Blvd',
    '89101',
    36.1699, -115.1398,
    'Premium cleaning services for luxury homes, hotels, and casinos in Las Vegas. White-glove service with attention to detail.',
    'Elite cleaning for the entertainment capital',
    4.7,
    94,
    true,
    false,
    '$$$',
    NULL,
    NULL,
    '+1-702-555-1700',
    'info@vegaselitecleaning.com',
    NULL,
    'active'
  ),

  -- Washington, DC
  (
    v_default_tenant_id,
    'Capital Clean Services',
    'Capital Clean Services',
    'Capital Clean Services LLC',
    'capital-clean-services-dc',
    'Washington',
    'DC',
    'US',
    '777 Pennsylvania Avenue',
    '20004',
    38.9072, -77.0369,
    'Professional cleaning services for homes and offices in the Washington DC metropolitan area. Trusted by government contractors and residents alike.',
    'Keeping the capital clean',
    4.6,
    198,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-202-555-1800',
    'service@capitalcleandc.com',
    NULL,
    'active'
  ),

  -- Calgary, AB, Canada
  (
    v_default_tenant_id,
    'Rocky Mountain Clean',
    'Rocky Mountain Clean',
    'Rocky Mountain Cleaning Services Ltd.',
    'rocky-mountain-clean-calgary',
    'Calgary',
    'AB',
    'CA',
    '888 8th Avenue SW',
    'T2P 3V5',
    51.0447, -114.0719,
    'Professional cleaning services in Calgary and surrounding areas. Reliable, affordable, and committed to customer satisfaction.',
    'Clean spaces in the heart of the Rockies',
    4.5,
    123,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-403-555-1900',
    'info@rockymountainclean.ca',
    NULL,
    'active'
  ),

  -- Austin, TX
  (
    v_default_tenant_id,
    'Keep Austin Clean',
    'Keep Austin Clean',
    'Keep Austin Clean LLC',
    'keep-austin-clean',
    'Austin',
    'TX',
    'US',
    '999 Congress Avenue',
    '78701',
    30.2672, -97.7431,
    'Eco-friendly cleaning services keeping Austin weird and clean! Serving residential and commercial clients with sustainable practices.',
    'Keeping Austin clean and weird',
    4.7,
    167,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-512-555-2000',
    'hello@keepaustinclean.com',
    NULL,
    'active'
  ),

  -- Philadelphia, PA
  (
    v_default_tenant_id,
    'City of Brotherly Clean',
    'City of Brotherly Clean',
    'City of Brotherly Clean Services Inc.',
    'city-of-brotherly-clean-philadelphia',
    'Philadelphia',
    'PA',
    'US',
    '111 Market Street',
    '19106',
    39.9526, -75.1652,
    'Comprehensive cleaning services for homes and businesses in Philadelphia. Professional team with years of experience and excellent reviews.',
    'The cleanest city of brotherly love',
    4.5,
    134,
    true,
    false,
    '$$',
    NULL,
    NULL,
    '+1-215-555-2100',
    'info@cityofbrotherlyclean.com',
    NULL,
    'active'
  );

END$$;

-- =========================
-- Summary
-- =========================
SELECT 
  'Seed data inserted successfully!' as message,
  COUNT(*) as total_companies,
  COUNT(*) FILTER (WHERE verified = true) as verified_companies,
  COUNT(*) FILTER (WHERE featured = true) as featured_companies,
  COUNT(*) FILTER (WHERE country = 'US') as us_companies,
  COUNT(*) FILTER (WHERE country = 'CA') as canada_companies
FROM public.companies
WHERE slug IN (
  'sparkle-clean-nyc',
  'pristine-maid-services-los-angeles',
  'eco-clean-chicago',
  'premier-cleaning-toronto',
  'shine-bright-miami',
  'spotless-pro-seattle',
  'crystal-clean-dallas',
  'fresh-home-cleaning-vancouver',
  'green-clean-denver',
  'elite-cleaning-services-phoenix',
  'texas-clean-co-houston',
  'boston-sparkle',
  'bay-area-clean-san-francisco',
  'propre-montreal',
  'peach-state-cleaning-atlanta',
  'eco-friendly-clean-portland',
  'vegas-elite-cleaning',
  'capital-clean-services-dc',
  'rocky-mountain-clean-calgary',
  'keep-austin-clean',
  'city-of-brotherly-clean-philadelphia'
);

