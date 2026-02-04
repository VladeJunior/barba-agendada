-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Policy: Anyone can view product images (public bucket)
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Policy: Shop owners can upload product images
CREATE POLICY "Shop owners can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM shops 
    WHERE shops.owner_id = auth.uid()
  )
);

-- Policy: Shop owners can update their product images
CREATE POLICY "Shop owners can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM shops 
    WHERE shops.owner_id = auth.uid()
  )
);

-- Policy: Shop owners can delete their product images
CREATE POLICY "Shop owners can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM shops 
    WHERE shops.owner_id = auth.uid()
  )
);