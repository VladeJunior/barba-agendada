-- Create storage buckets for shop images and barber avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('shop-logos', 'shop-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('shop-covers', 'shop-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('barber-avatars', 'barber-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

-- RLS Policies for shop-logos bucket
CREATE POLICY "Shop owners can upload their logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM shops WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can update their logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM shops WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can delete their logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM shops WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view shop logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-logos');

-- RLS Policies for shop-covers bucket
CREATE POLICY "Shop owners can upload their cover"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-covers'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM shops WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can update their cover"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-covers'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM shops WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can delete their cover"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-covers'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM shops WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view shop covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-covers');

-- RLS Policies for barber-avatars bucket
CREATE POLICY "Shop owners can upload barber avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barber-avatars'
  AND (storage.foldername(name))[1] IN (
    SELECT barbers.id::text 
    FROM barbers 
    JOIN shops ON shops.id = barbers.shop_id 
    WHERE shops.owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can update barber avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barber-avatars'
  AND (storage.foldername(name))[1] IN (
    SELECT barbers.id::text 
    FROM barbers 
    JOIN shops ON shops.id = barbers.shop_id 
    WHERE shops.owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can delete barber avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'barber-avatars'
  AND (storage.foldername(name))[1] IN (
    SELECT barbers.id::text 
    FROM barbers 
    JOIN shops ON shops.id = barbers.shop_id 
    WHERE shops.owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view barber avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barber-avatars');