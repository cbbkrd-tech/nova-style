-- Migration: Add subcategories table and link to products
-- Created: 2026-01-19

-- Tabela subcategories
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_category product_category NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks dla szybkiego filtrowania po kategorii
CREATE INDEX idx_subcategories_parent ON subcategories(parent_category);

-- Dodaj kolumnę subcategory_id do products
ALTER TABLE products ADD COLUMN subcategory_id UUID REFERENCES subcategories(id);

-- RLS policies
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subcategories are viewable by everyone" ON subcategories
  FOR SELECT USING (true);

-- Insert damskie podkategorie (15)
INSERT INTO subcategories (slug, name, parent_category, sort_order) VALUES
  ('t-shirty-topy', 'T-shirty, topy', 'women', 1),
  ('bluzki-body', 'Bluzki, body', 'women', 2),
  ('swetry-women', 'Swetry', 'women', 3),
  ('koszule-women', 'Koszule', 'women', 4),
  ('komplety', 'Komplety', 'women', 5),
  ('sukienki', 'Sukienki', 'women', 6),
  ('kombinezony', 'Kombinezony', 'women', 7),
  ('spodnice-spodenki', 'Spódnice i spodenki', 'women', 8),
  ('spodnie-women', 'Spodnie', 'women', 9),
  ('dresy-women', 'Dresy', 'women', 10),
  ('kurtki-women', 'Kurtki', 'women', 11),
  ('buty-women', 'Buty', 'women', 12),
  ('torebki', 'Torebki', 'women', 13),
  ('bielizna-women', 'Bielizna', 'women', 14),
  ('akcesoria-women', 'Akcesoria', 'women', 15);

-- Insert męskie podkategorie (9)
INSERT INTO subcategories (slug, name, parent_category, sort_order) VALUES
  ('t-shirty-men', 'T-shirty', 'men', 1),
  ('bluzy', 'Bluzy', 'men', 2),
  ('spodnie-men', 'Spodnie', 'men', 3),
  ('dresy-men', 'Dresy', 'men', 4),
  ('koszule-men', 'Koszule', 'men', 5),
  ('swetry-men', 'Swetry', 'men', 6),
  ('kurtki-men', 'Kurtki', 'men', 7),
  ('bielizna-men', 'Bielizna', 'men', 8),
  ('akcesoria-men', 'Akcesoria', 'men', 9);
