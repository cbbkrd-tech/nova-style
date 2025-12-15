-- Add RLS policies for admin operations via anon key
-- Note: For production, use proper authentication (Supabase Auth)

-- Allow anon to SELECT all products (including inactive) for admin panel
CREATE POLICY "Anon can view all products" ON products
  FOR SELECT USING (true);

-- Allow anon to INSERT products
CREATE POLICY "Anon can insert products" ON products
  FOR INSERT WITH CHECK (true);

-- Allow anon to UPDATE products
CREATE POLICY "Anon can update products" ON products
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow anon to DELETE products
CREATE POLICY "Anon can delete products" ON products
  FOR DELETE USING (true);

-- Allow anon to INSERT product_variants
CREATE POLICY "Anon can insert variants" ON product_variants
  FOR INSERT WITH CHECK (true);

-- Allow anon to UPDATE product_variants
CREATE POLICY "Anon can update variants" ON product_variants
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow anon to DELETE product_variants
CREATE POLICY "Anon can delete variants" ON product_variants
  FOR DELETE USING (true);
