export interface SubcategoryDefinition {
  slug: string;
  name: string;
  parentCategory: 'women' | 'men';
  image?: string;
}

export const SUBCATEGORIES: SubcategoryDefinition[] = [
  // Women (16)
  { slug: 't-shirty-topy', name: 'T-shirty i topy', parentCategory: 'women', image: '/images/categories/tshirty-topy.webp' },
  { slug: 'bluzki-body', name: 'Bluzki i body', parentCategory: 'women', image: '/images/categories/bluzki-body.webp' },
  { slug: 'swetry-women', name: 'Swetry', parentCategory: 'women', image: '/images/categories/swetry.webp' },
  { slug: 'bluzy-women', name: 'Bluzy', parentCategory: 'women', image: '/images/categories/bluzy-women.webp' },
  { slug: 'koszule-women', name: 'Koszule', parentCategory: 'women', image: '/images/categories/koszule.webp' },
  { slug: 'komplety', name: 'Komplety', parentCategory: 'women', image: '/images/categories/komplety.webp' },
  { slug: 'sukienki', name: 'Sukienki', parentCategory: 'women', image: '/images/categories/sukienki.webp' },
  { slug: 'kombinezony', name: 'Kombinezony', parentCategory: 'women', image: '/images/categories/kombinezony.webp' },
  { slug: 'spodnice-spodenki', name: 'Spódnice i spodenki', parentCategory: 'women', image: '/images/categories/spodnice-spodenki.webp' },
  { slug: 'spodnie-women', name: 'Spodnie', parentCategory: 'women', image: '/images/categories/spodnie.webp' },
  { slug: 'dresy-women', name: 'Dresy', parentCategory: 'women', image: '/images/categories/dresy.webp' },
  { slug: 'kurtki-women', name: 'Kurtki', parentCategory: 'women', image: '/images/categories/kurtki.webp' },
  { slug: 'buty-women', name: 'Buty', parentCategory: 'women', image: '/images/categories/buty.webp' },
  { slug: 'torebki', name: 'Torebki', parentCategory: 'women', image: '/images/categories/torebki.webp' },
  { slug: 'bielizna-women', name: 'Bielizna', parentCategory: 'women', image: '/images/categories/bielizna.webp' },
  { slug: 'akcesoria-women', name: 'Akcesoria', parentCategory: 'women', image: '/images/categories/akcesoria.webp' },
  { slug: 'plaszcze-women', name: 'Płaszcze', parentCategory: 'women', image: '/images/categories/plaszcze.webp' },
  { slug: 'legginsy', name: 'Legginsy', parentCategory: 'women', image: '/images/categories/legginsy.webp' },
  { slug: 'marynarki-women', name: 'Marynarki', parentCategory: 'women', image: '/images/categories/marynarki.webp' },

  // Men (11)
  { slug: 't-shirty-men', name: 'T-shirty', parentCategory: 'men', image: '/images/categories/tshirty-men.webp' },
  { slug: 'bluzy', name: 'Bluzy', parentCategory: 'men', image: '/images/categories/bluzy-men.webp' },
  { slug: 'spodnie-men', name: 'Spodnie', parentCategory: 'men', image: '/images/categories/spodnie-men.webp' },
  { slug: 'dresy-men', name: 'Dresy', parentCategory: 'men', image: '/images/categories/dresy-men.webp' },
  { slug: 'koszule-men', name: 'Koszule', parentCategory: 'men', image: '/images/categories/koszule-men.webp' },
  { slug: 'swetry-men', name: 'Swetry', parentCategory: 'men', image: '/images/categories/swetry-men.webp' },
  { slug: 'kurtki-men', name: 'Kurtki', parentCategory: 'men', image: '/images/categories/kurtki-men.webp' },
  { slug: 'bielizna-men', name: 'Bielizna', parentCategory: 'men', image: '/images/categories/bielizna-men.webp' },
  { slug: 'akcesoria-men', name: 'Akcesoria', parentCategory: 'men', image: '/images/categories/akcesoria-men.webp' },
  { slug: 'plaszcze-men', name: 'Płaszcze', parentCategory: 'men', image: '/images/categories/plaszcze-men.webp' },
  { slug: 'marynarki-men', name: 'Marynarki', parentCategory: 'men', image: '/images/categories/marynarki-men.webp' },
];

export const getSubcategoriesByCategory = (category: 'women' | 'men'): SubcategoryDefinition[] =>
  SUBCATEGORIES.filter(s => s.parentCategory === category);

export const getSubcategoryBySlug = (slug: string): SubcategoryDefinition | undefined =>
  SUBCATEGORIES.find(s => s.slug === slug);
