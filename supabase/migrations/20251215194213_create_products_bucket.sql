-- Create products storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Public read access for products" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

-- Allow authenticated uploads (we'll use anon for simplicity)
CREATE POLICY "Allow uploads to products bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products');

-- Allow updates
CREATE POLICY "Allow updates to products bucket" ON storage.objects
FOR UPDATE USING (bucket_id = 'products');

-- Allow deletes
CREATE POLICY "Allow deletes from products bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'products');
