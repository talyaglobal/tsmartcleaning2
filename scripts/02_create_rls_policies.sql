-- RLS Policies for Users table
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view provider profiles"
  ON public.users FOR SELECT
  USING (role = 'provider');

-- RLS Policies for Addresses table
CREATE POLICY "Users can view their own addresses"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Provider Profiles
CREATE POLICY "Anyone can view provider profiles"
  ON public.provider_profiles FOR SELECT
  USING (true);

CREATE POLICY "Providers can update their own profile"
  ON public.provider_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert their own profile"
  ON public.provider_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Services
CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (is_active = true);

-- RLS Policies for Provider Services
CREATE POLICY "Anyone can view provider services"
  ON public.provider_services FOR SELECT
  USING (true);

CREATE POLICY "Providers can manage their own services"
  ON public.provider_services FOR ALL
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Bookings
CREATE POLICY "Customers can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Providers can view their assigned bookings"
  ON public.bookings FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their pending bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = customer_id AND status = 'pending');

CREATE POLICY "Providers can update their assigned bookings"
  ON public.bookings FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Customers can create reviews for their completed bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Providers can respond to their reviews"
  ON public.reviews FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Transactions
CREATE POLICY "Customers can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Providers can view their transactions"
  ON public.transactions FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Provider Availability
CREATE POLICY "Anyone can view provider availability"
  ON public.provider_availability FOR SELECT
  USING (true);

CREATE POLICY "Providers can manage their own availability"
  ON public.provider_availability FOR ALL
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);
