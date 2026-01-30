/**
 * Transforms a Supabase Storage URL to use image transformations
 * This generates optimized thumbnails server-side, eliminating aliasing artifacts
 *
 * @param url - Original image URL
 * @param width - Desired width
 * @param height - Optional height (maintains aspect ratio if omitted)
 * @param quality - Image quality 1-100 (default 80)
 * @returns Transformed URL or original if not a Supabase URL
 */
export function getOptimizedImageUrl(
  url: string,
  width: number,
  height?: number,
  quality: number = 80
): string {
  // Only transform Supabase storage URLs
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }

  // Replace /object/ with /render/image/ for transformation endpoint
  const transformedUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  // Build query params
  const params = new URLSearchParams();
  params.set('width', width.toString());
  if (height) {
    params.set('height', height.toString());
  }
  params.set('resize', 'contain');
  params.set('quality', quality.toString());

  return `${transformedUrl}?${params.toString()}`;
}

// Preset sizes for common use cases
export const IMAGE_SIZES = {
  // Product grid thumbnails (aspect 3:4)
  thumbnail: { width: 400, height: 533 },
  // Cart thumbnails
  cartThumbnail: { width: 150, height: 200 },
  // Product detail gallery thumbnails
  galleryThumbnail: { width: 120, height: 160 },
  // Product detail main image
  productMain: { width: 800, height: 1066 },
  // Full size (for zoom)
  full: { width: 1200, height: 1600 },
} as const;
