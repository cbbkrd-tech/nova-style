export interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
}

export interface Subcategory {
  id: string;
  slug: string;
  name: string;
  parentCategory: 'men' | 'women';
  sortOrder: number;
}

export interface Product {
  id: number;
  supabaseId?: string; // Original Supabase UUID
  name: string;
  price: number;
  image: string;
  images?: ProductImage[]; // Multiple images support
  category: 'men' | 'women';
  subcategoryId?: string;
  subcategorySlug?: string;
  subcategoryName?: string;
  brandId?: string;
  brandSlug?: string;
  brandName?: string;
  color: string;
  description?: string;
  sizeGuide?: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  stock: number;
}

export interface CartItem extends Product {
  cartId: string;
  selectedSize: string;
  quantity: number;
}

export type ViewState = 'home' | 'men' | 'women' | 'men-categories' | 'women-categories' | 'brand' | 'cart' | 'product' | 'checkout' | 'payment-success' | 'payment-cancelled' | 'payment-error';