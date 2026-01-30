import React from 'react';
import { Product } from '../types/types';
import OptimizedImage from './OptimizedImage';
import { prefetchProduct } from '../lib/productCache';
import { IMAGE_SIZES } from '../lib/imageUtils';

interface ProductGridProps {
  title?: string;
  categoryTitle?: string;
  products: Product[];
  onProductClick: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ title, categoryTitle, products, onProductClick }) => {
  return (
    <div className="max-w-[1400px] py-8 md:py-12 px-4 md:px-6 mx-auto animate-fade-in">
      {/* Category Title */}
      {categoryTitle && (
        <h1 className="text-2xl md:text-3xl font-serif tracking-[0.1em] text-charcoal mb-6">
          {categoryTitle}
        </h1>
      )}

      {/* Filter Button for mobile */}
      {categoryTitle && (
        <button className="md:hidden w-full border border-light-grey text-charcoal/60 uppercase tracking-widest text-xs font-medium py-3 mb-6 hover:border-charcoal hover:text-charcoal transition-colors">
          Filtry / Sortuj
        </button>
      )}

      {title && (
        <h2 className="text-2xl font-serif tracking-wide text-charcoal mb-6">{title}</h2>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="product-card group flex flex-col cursor-pointer"
            onClick={() => onProductClick(product)}
            onMouseEnter={() => product.supabaseId && prefetchProduct(product.supabaseId)}
          >
            {/* Image Container with grey background */}
            <div className="relative aspect-[3/4] bg-product-bg mb-3 overflow-hidden">
              <OptimizedImage
                src={product.image}
                alt={product.name}
                containerClassName="w-full h-full"
                className="product-image w-full h-full object-cover"
                width={IMAGE_SIZES.thumbnail.width}
                height={IMAGE_SIZES.thumbnail.height}
              />
            </div>

            {/* Product Info */}
            <div>
              <h3 className="text-xs md:text-sm font-normal text-charcoal leading-tight mb-1 line-clamp-2">
                {product.name}
              </h3>
              <span className="text-xs md:text-sm font-medium text-charcoal">
                {product.price} PLN
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
