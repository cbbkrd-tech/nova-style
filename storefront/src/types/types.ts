export interface Product {
  id: number;
  supabaseId?: string; // Original Supabase UUID
  name: string;
  price: number;
  image: string;
  category: 'men' | 'women';
  subCategory: string; // e.g., "BLUZA OVERSIZE", "SPODNIE CARGO"
  color: string;
  description?: string;
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

export type ViewState = 'home' | 'men' | 'women' | 'cart' | 'product';