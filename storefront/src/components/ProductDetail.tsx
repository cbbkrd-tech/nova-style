import { useState, useEffect } from 'react';
import { Product, ProductVariant, ProductImage } from '../types/types';
import { supabase } from '../lib/medusa';
import { getCachedProduct } from '../lib/productCache';
import OptimizedImage from './OptimizedImage';
import { ChevronLeftIcon } from './Icons';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

function sortBySize(variants: ProductVariant[]) {
  return [...variants].sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));
}

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onAddToCart }) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [currentImage, setCurrentImage] = useState(product.image);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Scroll to top when product detail opens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product.id]);

  useEffect(() => {
    async function fetchData() {
      if (!product.supabaseId) {
        // Fallback for demo products without Supabase ID
        setVariants([
          { id: '1', size: 'XS', stock: 3 },
          { id: '2', size: 'S', stock: 5 },
          { id: '3', size: 'M', stock: 10 },
          { id: '4', size: 'L', stock: 8 },
          { id: '5', size: 'XL', stock: 3 },
          { id: '6', size: 'XXL', stock: 2 },
        ]);
        setLoading(false);
        return;
      }

      // Check cache first (populated by hover prefetch)
      const cached = getCachedProduct(product.supabaseId);
      if (cached) {
        setVariants(cached.variants);
        if (cached.images.length > 0) {
          const productImages = cached.images.map(img => ({
            id: img.id,
            url: img.image_url,
            isMain: img.is_main ?? false,
          }));
          setImages(productImages);
          const mainImg = productImages.find(img => img.isMain);
          if (mainImg) {
            setCurrentImage(mainImg.url);
          }
        }
        setLoading(false);
        return;
      }

      try {
        // Fetch variants and images in parallel
        const [variantsRes, imagesRes] = await Promise.all([
          supabase
            .from('product_variants')
            .select('id, size, stock')
            .eq('product_id', product.supabaseId)
            .order('size'),
          supabase
            .from('product_images')
            .select('id, image_url, is_main, sort_order')
            .eq('product_id', product.supabaseId)
            .order('sort_order'),
        ]);

        if (variantsRes.data && variantsRes.data.length > 0) {
          setVariants(variantsRes.data.map(v => ({ ...v, stock: v.stock ?? 0 })));
        }

        if (imagesRes.data && imagesRes.data.length > 0) {
          const productImages = imagesRes.data.map(img => ({
            id: img.id,
            url: img.image_url,
            isMain: img.is_main ?? false,
          }));
          setImages(productImages);
          // Set main image as current
          const mainImg = productImages.find(img => img.isMain);
          if (mainImg) {
            setCurrentImage(mainImg.url);
          }
        }
      } catch (err) {
        console.error('Failed to fetch product data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [product.supabaseId]);

  const selectedVariant = variants.find(v => v.size === selectedSize);
  const maxQuantity = selectedVariant?.stock || 0;
  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0;

  const handleAddToCart = () => {
    if (!selectedSize || isOutOfStock) return;
    onAddToCart(product, selectedSize, quantity);
  };

  return (
    <div className="w-full px-4 md:px-6 py-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 text-sm text-charcoal/60 hover:text-charcoal flex items-center gap-1 transition-colors"
      >
        <ChevronLeftIcon />
        Powrót
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Product Images */}
        <div className="flex gap-3">
          {/* Thumbnails - only show if multiple images */}
          {images.length > 1 && (
            <div className="flex flex-col gap-2 w-16 md:w-20 shrink-0">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImage(img.url)}
                  className={`aspect-square overflow-hidden transition-all border ${
                    currentImage === img.url
                      ? 'border-charcoal'
                      : 'border-light-grey opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Image - clickable for lightbox */}
          <div
            className="flex-1 h-[60vh] md:h-[75vh] max-h-[900px] bg-product-bg relative group cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
          >
            <OptimizedImage
              src={currentImage}
              alt={product.name}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover"
            />
            {/* Zoom icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-serif tracking-wide text-charcoal mb-2">
            {product.name}
          </h1>

          <p className="text-charcoal/60 text-sm uppercase tracking-wide mb-4">
            {product.subcategoryName || (product.category === 'women' ? 'KOBIETY' : 'MĘŻCZYŹNI')}
          </p>

          <p className="text-2xl font-medium text-charcoal mb-8">
            {product.price} PLN
          </p>

          {product.description && (
            <p className="text-charcoal/70 mb-6 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Size Selection */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-3">
              Wybierz rozmiar
            </h3>

            {loading ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-14 h-14 bg-light-grey animate-pulse" />
                ))}
              </div>
            ) : variants.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sortBySize(variants).filter(v => v.stock >= 0).map((variant) => {
                  const isSelected = selectedSize === variant.size;
                  const outOfStock = variant.stock === 0;

                  return (
                    <button
                      key={variant.id}
                      onClick={() => !outOfStock && setSelectedSize(variant.size)}
                      disabled={outOfStock}
                      className={`
                        w-14 h-14 border text-sm font-medium uppercase transition-all btn-press
                        ${isSelected
                          ? 'bg-warm-beige text-charcoal border-warm-beige'
                          : outOfStock
                            ? 'bg-light-grey/50 text-charcoal/30 border-light-grey cursor-not-allowed line-through'
                            : 'bg-transparent text-charcoal border-light-grey hover:border-charcoal'
                        }
                      `}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-charcoal/50 text-sm">Brak dostępnych rozmiarów</p>
            )}
          </div>

          {/* Stock Info */}
          {selectedVariant && (
            <div className="mb-6">
              <p className={`text-sm ${selectedVariant.stock <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                {selectedVariant.stock <= 3 && selectedVariant.stock > 0
                  ? `Ostatnie ${selectedVariant.stock} sztuki!`
                  : selectedVariant.stock === 0
                    ? 'Brak w magazynie'
                    : `Dostępne: ${selectedVariant.stock} szt.`
                }
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          {selectedSize && !isOutOfStock && (
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-3">
                Ilość
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 border border-light-grey text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-white transition-all btn-press"
                >
                  -
                </button>
                <span className="text-lg font-medium w-8 text-center text-charcoal">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                  className="w-10 h-10 border border-light-grey text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-white transition-all btn-press"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize || isOutOfStock}
            className={`
              w-full py-4 font-semibold uppercase tracking-widest text-sm transition-all btn-press
              ${!selectedSize || isOutOfStock
                ? 'bg-light-grey text-charcoal/40 cursor-not-allowed'
                : 'bg-warm-beige text-charcoal hover:bg-warm-beige-hover'
              }
            `}
          >
            {!selectedSize
              ? 'Wybierz rozmiar'
              : isOutOfStock
                ? 'Brak w magazynie'
                : 'Dodaj do koszyka'
            }
          </button>

          {/* Product Details */}
          <div className="mt-8 pt-8 border-t border-light-grey">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-3">
              Szczegóły produktu
            </h3>
            <ul className="text-charcoal/70 text-sm space-y-2">
              <li>Kolor: {product.color}</li>
              <li>Kategoria: {product.category === 'women' ? 'Kobiety' : 'Mężczyźni'}</li>
            </ul>
          </div>

          {/* Size Guide */}
          {product.sizeGuide && (
            <div className="mt-6 pt-6 border-t border-light-grey">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-3">
                Tabela rozmiarów
              </h3>
              <p className="text-charcoal/70 text-sm whitespace-pre-line">
                {product.sizeGuide}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox for full-size image */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation arrows for multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIdx = images.findIndex(img => img.url === currentImage);
                  const prevIdx = currentIdx > 0 ? currentIdx - 1 : images.length - 1;
                  setCurrentImage(images[prevIdx].url);
                }}
                className="absolute left-4 w-12 h-12 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIdx = images.findIndex(img => img.url === currentImage);
                  const nextIdx = currentIdx < images.length - 1 ? currentIdx + 1 : 0;
                  setCurrentImage(images[nextIdx].url);
                }}
                className="absolute right-4 w-12 h-12 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Full resolution image */}
          <img
            src={currentImage}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
