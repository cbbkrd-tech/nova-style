import { useState, useEffect } from 'react';
import { Product, ProductVariant, ProductImage } from '../types/types';
import { supabase } from '../lib/medusa';
import OptimizedImage from './OptimizedImage';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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
        className="mb-6 text-sm text-gray-400 hover:text-white flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
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
                  className={`aspect-square rounded-lg overflow-hidden transition-all ${
                    currentImage === img.url
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900'
                      : 'opacity-60 hover:opacity-100'
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

          {/* Main Image */}
          <div className="flex-1 aspect-[3/4] rounded-xl bg-blk-800">
            <OptimizedImage
              src={currentImage}
              alt={product.name}
              containerClassName="w-full h-full rounded-xl"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white mb-2">
            {product.name}
          </h1>

          <p className="text-gray-400 text-sm uppercase tracking-wide mb-4">
            {product.subCategory}
          </p>

          <p className="text-3xl font-bold text-white mb-8">
            {product.price} PLN
          </p>

          {product.description && (
            <p className="text-gray-300 mb-6">
              {product.description}
            </p>
          )}

          {/* Size Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-3">
              Wybierz rozmiar
            </h3>

            {loading ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-14 h-14 bg-gray-700 rounded animate-pulse" />
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
                        w-14 h-14 rounded border text-sm font-bold uppercase transition-all
                        ${isSelected
                          ? 'bg-white text-black border-white'
                          : outOfStock
                            ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed line-through'
                            : 'bg-transparent text-white border-gray-600 hover:border-white'
                        }
                      `}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Brak dostępnych rozmiarów</p>
            )}
          </div>

          {/* Stock Info */}
          {selectedVariant && (
            <div className="mb-6">
              <p className={`text-sm ${selectedVariant.stock <= 3 ? 'text-orange-400' : 'text-green-400'}`}>
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
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-3">
                Ilość
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 border border-gray-600 rounded text-white hover:bg-white hover:text-black transition-all"
                >
                  -
                </button>
                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                  className="w-10 h-10 border border-gray-600 rounded text-white hover:bg-white hover:text-black transition-all"
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
              w-full py-4 rounded font-bold uppercase tracking-widest text-sm transition-all
              ${!selectedSize || isOutOfStock
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-white text-black hover:bg-gray-200'
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
          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-3">
              Szczegóły produktu
            </h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>Kolor: {product.color}</li>
              <li>Kategoria: {product.category === 'women' ? 'Kobiety' : 'Mężczyźni'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
