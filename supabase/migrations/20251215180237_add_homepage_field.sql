-- Add show_on_homepage field to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT true;

-- Update existing products to show on homepage
UPDATE products SET show_on_homepage = true WHERE show_on_homepage IS NULL;
