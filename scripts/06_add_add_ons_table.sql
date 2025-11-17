-- Create add_ons table to store optional extras separate from core services
CREATE TABLE IF NOT EXISTS public.add_ons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- free-form; business-level categories (e.g., 'home_care', 'repairs')
  base_price DECIMAL(10, 2) NOT NULL,
  unit TEXT DEFAULT 'flat_rate' CHECK (unit IN ('flat_rate', 'per_hour', 'per_sqft')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: add simple index for quick listing/filtering
CREATE INDEX IF NOT EXISTS add_ons_is_active_idx ON public.add_ons (is_active);
CREATE INDEX IF NOT EXISTS add_ons_category_idx ON public.add_ons (category);


