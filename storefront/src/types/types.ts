export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: 'men' | 'women';
  subCategory: string; // e.g., "BLUZA OVERSIZE", "SPODNIE CARGO"
  color: string;
}

export interface CartItem extends Product {
  cartId: string;
  selectedSize: string;
  quantity: number;
}

export type ViewState = 'home' | 'men' | 'women' | 'cart';