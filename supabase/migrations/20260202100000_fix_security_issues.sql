-- Fix Supabase security warnings
-- 1. Enable RLS on tables missing it
-- 2. Fix function search_path
-- 3. Fix overly permissive RLS policies

-- ============================================
-- 1. ENABLE RLS ON TABLES WITHOUT IT
-- ============================================

-- Enable RLS on tables that don't have it
-- (These may have been created outside of migrations)
DO $$
BEGIN
    -- invoices
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
        ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

        -- Allow service role full access
        DROP POLICY IF EXISTS "Service role full access to invoices" ON public.invoices;
        CREATE POLICY "Service role full access to invoices" ON public.invoices
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- clients
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
        ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Service role full access to clients" ON public.clients;
        CREATE POLICY "Service role full access to clients" ON public.clients
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- invoice_comments
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoice_comments') THEN
        ALTER TABLE public.invoice_comments ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Service role full access to invoice_comments" ON public.invoice_comments;
        CREATE POLICY "Service role full access to invoice_comments" ON public.invoice_comments
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- message_history
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_history') THEN
        ALTER TABLE public.message_history ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Service role full access to message_history" ON public.message_history;
        CREATE POLICY "Service role full access to message_history" ON public.message_history
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- brands
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brands') THEN
        ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Service role full access to brands" ON public.brands;
        CREATE POLICY "Service role full access to brands" ON public.brands
            FOR ALL USING (auth.role() = 'service_role');

        -- Brands might need public read access
        DROP POLICY IF EXISTS "Public can read brands" ON public.brands;
        CREATE POLICY "Public can read brands" ON public.brands
            FOR SELECT USING (true);
    END IF;
END $$;

-- ============================================
-- 2. FIX FUNCTION SEARCH_PATH
-- ============================================

-- Recreate update_orders_updated_at with fixed search_path
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate update_updated_at_column with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. FIX OVERLY PERMISSIVE RLS POLICIES
-- ============================================

-- Fix orders policy - restrict to service_role only
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
CREATE POLICY "Service role can manage orders" ON public.orders
    FOR ALL USING (auth.role() = 'service_role');

-- Fix product_images policy (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_images') THEN
        DROP POLICY IF EXISTS "Allow all operations on product_images" ON public.product_images;

        -- Public read access
        CREATE POLICY "Public can read product_images" ON public.product_images
            FOR SELECT USING (true);

        -- Service role can manage
        CREATE POLICY "Service role can manage product_images" ON public.product_images
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- NOTE: Keeping "Anon can ..." policies for products/product_variants
-- because admin panel currently uses anon key in frontend.
--
-- TODO: For production security, implement one of these:
-- 1. Use Supabase Auth for admin users
-- 2. Create Edge Functions for admin operations (use service_role there)
-- 3. Move admin panel to separate backend app
--
-- Current policies kept (will show as WARN but admin panel works):
-- - "Anon can insert/update/delete products"
-- - "Anon can insert/update/delete variants"
