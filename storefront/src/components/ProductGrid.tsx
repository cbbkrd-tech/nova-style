import React from 'react';
import { Product } from '../types/types';
import OptimizedImage from './OptimizedImage';

interface ProductGridProps {
  title?: string;
  categoryTitle?: string;
  products: Product[];
  onProductClick: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ title, categoryTitle, products, onProductClick }) => {
  return (
    <div className="w-[90%] md:w-[75%] py-4 md:py-6 mx-auto animate-fade-in">
      {/* Category Title for mobile */}
      {categoryTitle && (
        <h1 className="text-2xl md:text-3xl font-normal tracking-[0.1em] text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          {categoryTitle}
        </h1>
      )}

      {/* Filter Button for mobile */}
      {categoryTitle && (
        <button className="md:hidden w-full border border-gray-500 text-gray-300 uppercase tracking-widest text-xs font-medium py-3 mb-6 hover:border-white hover:text-white transition-colors">
          Filtry / Sortuj
        </button>
      )}

      {title && <h2 className="text-3xl font-black uppercase tracking-wide text-white mb-6">{title}</h2>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="group flex flex-col"
          >
            {/* Image Container */}
            <div
              className="relative aspect-[3/4] rounded-lg bg-blk-800 mb-3 cursor-pointer"
              onClick={() => onProductClick(product)}
            >
              <OptimizedImage
                src={product.image}
                alt={product.name}
                containerClassName="w-full h-full rounded-lg"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Product Info */}
            <div className="cursor-pointer" onClick={() => onProductClick(product)}>
              <h3 className="text-[13px] font-normal text-gray-200 uppercase tracking-wide leading-tight mb-1 truncate">
                {product.name}
              </h3>
              <span className="text-[13px] font-medium text-white">
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