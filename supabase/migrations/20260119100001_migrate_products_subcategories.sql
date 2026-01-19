-- Migration: Assign existing products to subcategories
-- Created: 2026-01-19

-- Przypisz istniejące produkty do podkategorii na podstawie nazwy

-- DRES -> dresy (damskie)
UPDATE products SET subcategory_id = (
  SELECT id FROM subcategories WHERE slug = 'dresy-women'
) WHERE name ILIKE '%DRES%' AND category = 'women';

-- DRES -> dresy (męskie)
UPDATE products SET subcategory_id = (
  SELECT id FROM subcategories WHERE slug = 'dresy-men'
) WHERE name ILIKE '%DRES%' AND category = 'men';

-- BLUZA -> bluzki, body (damskie)
UPDATE products SET subcategory_id = (
  SELECT id FROM subcategories WHERE slug = 'bluzki-body'
) WHERE name ILIKE '%BLUZA%' AND category = 'women';

-- BLUZA -> bluzy (męskie)
UPDATE products SET subcategory_id = (
  SELECT id FROM subcategories WHERE slug = 'bluzy'
) WHERE name ILIKE '%BLUZA%' AND category = 'men';

-- TSHIRT -> t-shirty, topy (damskie)
UPDATE products SET subcategory_id = (
  SELECT id FROM subcategories WHERE slug = 't-shirty-topy'
) WHERE name ILIKE '%TSHIRT%' AND category = 'women';

-- TSHIRT -> t-shirty (męskie)
UPDATE products SET subcategory_id = (
  SELECT id FROM subcategories WHERE slug = 't-shirty-men'
) WHERE name ILIKE '%TSHIRT%' AND category = 'men';

-- KURTKA -> kurtki (damskie)
UPDATE products SET subcategory_id = (
  SELECT id FROM subcategories WHERE slug = 'kurtki-women'
) WHERE name ILIKE '%KURTKA%' AND category = 'women';

-- KURTKA -> kurtki (męskie)
UPDATE products SET subcategory_id = (
  SELECT id FROM subcategories WHERE slug = 'kurtki-men'
) WHERE name ILIKE '%KURTKA%' AND category = 'men';
