import { useState, useEffect } from 'react';
import { supabase } from '../lib/medusa';
import type { Tables } from '../types/database';

export type DbProduct = Tables<'products'>;
export type DbProductVariant = Tables<'product_variants'>;

export interface ProductWithVariants extends DbProduct {
  variants: DbProductVariant[];
}

export function useProducts(category?: 'men' | 'women') {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        let query = supabase
          .from('products')
          .select(`
            *,
            variants:product_variants(*)
          `)
          .eq('is_active', true);

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setProducts((data as ProductWithVariants[]) || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch products'));
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [category]);

  return { products, loading, error };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;

      try {
        setLoading(true);

        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            *,
            variants:product_variants(*)
          `)
          .eq('slug', slug)
          .single();

        if (fetchError) throw fetchError;

        setProduct(data as ProductWithVariants);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch product'));
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  return { product, loading, error };
}
