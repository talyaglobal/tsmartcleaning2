-- Seed baseline add-ons. Safe to run multiple times.
INSERT INTO public.add_ons (name, description, category, base_price, unit)
VALUES
  ('Laundry & Ironing', 'Laundry folding and ironing add-on', 'home_care', 25.00, 'flat_rate'),
  ('Interior Design Consultation', 'Virtual or in-person design consultation', 'consulting', 120.00, 'flat_rate'),
  ('Organization Services', 'Closet, pantry, and space organization', 'home_care', 60.00, 'flat_rate'),
  ('Handyman Repairs', 'Minor household repairs and fixes', 'repairs', 85.00, 'flat_rate'),
  ('Gardening / Outdoor Cleaning', 'Light gardening and outdoor cleanup', 'outdoor', 70.00, 'flat_rate'),
  ('Pest Control', 'Basic pest control service', 'pest_control', 150.00, 'flat_rate'),
  ('HVAC Cleaning', 'Duct and vent cleaning', 'hvac', 140.00, 'flat_rate'),
  ('Smart Home Setup', 'Install and configure smart devices', 'tech', 110.00, 'flat_rate')
ON CONFLICT DO NOTHING;


