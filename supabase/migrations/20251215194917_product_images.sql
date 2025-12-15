-- Create product_images table for multiple images per product
CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Public read access for product_images" ON product_images
FOR SELECT USING (true);

-- Allow all operations (simplified for demo)
CREATE POLICY "Allow all operations on product_images" ON product_images
FOR ALL USING (true) WITH CHECK (true);

-- Migrate existing product images to new table
INSERT INTO product_images (product_id, image_url, is_main, sort_order)
SELECT id, image_url, true, 0
FROM products
WHERE image_url IS NOT NULL;
