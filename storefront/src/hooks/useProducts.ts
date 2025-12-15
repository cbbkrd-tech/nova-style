import { useQuery } from '@tanstack/react-query';
import medusa from '../lib/medusa';

export interface MedusaProduct {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  images: Array<{ url: string }>;
  variants: Array<{
    id: string;
    title: string;
    prices: Array<{
      amount: number;
      currency_code: string;
    }>;
  }>;
  metadata?: {
    category?: 'men' | 'women';
    color?: string;
    subCategory?: string;
  };
}

export function useProducts(category?: 'men' | 'women') {
  return useQuery({
    queryKey: ['products', category],
    queryFn: async () => {
      const { products } = await medusa.store.product.list({
        limit: 100,
      });

      // Filter by category if provided
      if (category && products) {
        return products.filter(
          (p: MedusaProduct) => p.metadata?.category === category
        );
      }

      return products || [];
    },
  });
}

export function useProduct(handle: string) {
  return useQuery({
    queryKey: ['product', handle],
    queryFn: async () => {
      const { products } = await medusa.store.product.list({
        handle,
      });
      return products?.[0] || null;
    },
    enabled: !!handle,
  });
}
