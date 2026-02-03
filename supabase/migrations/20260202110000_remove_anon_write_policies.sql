-- Remove overly permissive "Anon can..." policies
-- Admin panel now uses Edge Function with service_role

-- Remove products write policies for anon
DROP POLICY IF EXISTS "Anon can insert products" ON public.products;
DROP POLICY IF EXISTS "Anon can update products" ON public.products;
DROP POLICY IF EXISTS "Anon can delete products" ON public.products;

-- Remove product_variants write policies for anon
DROP POLICY IF EXISTS "Anon can insert variants" ON public.product_variants;
DROP POLICY IF EXISTS "Anon can update variants" ON public.product_variants;
DROP POLICY IF EXISTS "Anon can delete variants" ON public.product_variants;

-- Keep read policies:
-- "Products are viewable by everyone" - storefront needs this
-- "Anon can view all products" - admin panel needs this for listing
-- "Product variants are viewable by everyone" - storefront needs this
