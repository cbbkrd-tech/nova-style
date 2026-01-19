export interface SubcategoryDefinition {
  slug: string;
  name: string;
  parentCategory: 'women' | 'men';
}

export const SUBCATEGORIES: SubcategoryDefinition[] = [
  // Women (15)
  { slug: 't-shirty-topy', name: 'T-shirty, topy', parentCategory: 'women' },
  { slug: 'bluzki-body', name: 'Bluzki, body', parentCategory: 'women' },
  { slug: 'swetry-women', name: 'Swetry', parentCategory: 'women' },
  { slug: 'koszule-women', name: 'Koszule', parentCategory: 'women' },
  { slug: 'komplety', name: 'Komplety', parentCategory: 'women' },
  { slug: 'sukienki', name: 'Sukienki', parentCategory: 'women' },
  { slug: 'kombinezony', name: 'Kombinezony', parentCategory: 'women' },
  { slug: 'spodnice-spodenki', name: 'Spódnice i spodenki', parentCategory: 'women' },
  { slug: 'spodnie-women', name: 'Spodnie', parentCategory: 'women' },
  { slug: 'dresy-women', name: 'Dresy', parentCategory: 'women' },
  { slug: 'kurtki-women', name: 'Kurtki', parentCategory: 'women' },
  { slug: 'buty-women', name: 'Buty', parentCategory: 'women' },
  { slug: 'torebki', name: 'Torebki', parentCategory: 'women' },
  { slug: 'bielizna-women', name: 'Bielizna', parentCategory: 'women' },
  { slug: 'akcesoria-women', name: 'Akcesoria', parentCategory: 'women' },

  // Men (9)
  { slug: 't-shirty-men', name: 'T-shirty', parentCategory: 'men' },
  { slug: 'bluzy', name: 'Bluzy', parentCategory: 'men' },
  { slug: 'spodnie-men', name: 'Spodnie', parentCategory: 'men' },
  { slug: 'dresy-men', name: 'Dresy', parentCategory: 'men' },
  { slug: 'koszule-men', name: 'Koszule', parentCategory: 'men' },
  { slug: 'swetry-men', name: 'Swetry', parentCategory: 'men' },
  { slug: 'kurtki-men', name: 'Kurtki', parentCategory: 'men' },
  { slug: 'bielizna-men', name: 'Bielizna', parentCategory: 'men' },
  { slug: 'akcesoria-men', name: 'Akcesoria', parentCategory: 'men' },
];

export const getSubcategoriesByCategory = (category: 'women' | 'men'): SubcategoryDefinition[] =>
  SUBCATEGORIES.filter(s => s.parentCategory === category);

export const getSubcategoryBySlug = (slug: string): SubcategoryDefinition | undefined =>
  SUBCATEGORIES.find(s => s.slug === slug);
