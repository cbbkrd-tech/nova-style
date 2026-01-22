import { supabase } from './medusa';

interface CachedProductData {
  variants: Array<{ id: string; size: string; stock: number }>;
  images: Array<{ id: string; image_url: string; is_main: boolean | null; sort_order: number | null }>;
}

const cache = new Map<string, CachedProductData>();
const pending = new Set<string>();

export async function prefetchProduct(productId: string): Promise<void> {
  if (cache.has(productId) || pending.has(productId)) return;

  pending.add(productId);

  try {
    const [variantsRes, imagesRes] = await Promise.all([
      supabase
        .from('product_variants')
        .select('id, size, stock')
        .eq('product_id', productId)
        .order('size'),
      supabase
        .from('product_images')
        .select('id, image_url, is_main, sort_order')
        .eq('product_id', productId)
        .order('sort_order'),
    ]);

    cache.set(productId, {
      variants: (variantsRes.data || []).map(v => ({ ...v, stock: v.stock ?? 0 })),
      images: imagesRes.data || [],
    });
  } finally {
    pending.delete(productId);
  }
}

export function getCachedProduct(productId: string): CachedProductData | undefined {
  return cache.get(productId);
}
