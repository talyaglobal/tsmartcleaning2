-- Seed initial services
INSERT INTO public.services (name, description, category, base_price, unit) VALUES
  ('Standard House Cleaning', 'Regular cleaning including dusting, vacuuming, mopping, and bathroom cleaning', 'residential', 35.00, 'per_hour'),
  ('Deep Cleaning', 'Intensive cleaning including baseboards, inside appliances, and hard-to-reach areas', 'deep', 50.00, 'per_hour'),
  ('Move-In/Move-Out Cleaning', 'Comprehensive cleaning for vacant properties', 'move', 45.00, 'per_hour'),
  ('Office Cleaning', 'Commercial cleaning for office spaces', 'commercial', 40.00, 'per_hour'),
  ('Post-Construction Cleaning', 'Specialized cleaning after renovation or construction', 'post-construction', 55.00, 'per_hour'),
  ('Window Cleaning', 'Interior and exterior window cleaning', 'window', 150.00, 'flat_rate'),
  ('Carpet Cleaning', 'Professional carpet shampooing and stain removal', 'carpet', 0.30, 'per_sqft'),
  ('Eco-Friendly Cleaning', 'Green cleaning using environmentally safe products', 'eco-friendly', 40.00, 'per_hour')
ON CONFLICT DO NOTHING;
