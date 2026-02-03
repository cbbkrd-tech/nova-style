-- Fix image URLs from .jpg/.jpeg to .webp

-- Update products table
UPDATE products
SET image_url = regexp_replace(image_url, '\.(jpg|jpeg)$', '.webp')
WHERE image_url LIKE '%.jpg' OR image_url LIKE '%.jpeg';

-- Update product_images table
UPDATE product_images
SET image_url = regexp_replace(image_url, '\.(jpg|jpeg)$', '.webp')
WHERE image_url LIKE '%.jpg' OR image_url LIKE '%.jpeg';
