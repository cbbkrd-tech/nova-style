import React from 'react';
import { Product } from '../types/types';

interface ProductGridProps {
  title?: string;
  products: Product[];
  onProductClick: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ title, products, onProductClick }) => {
  return (
    <div className="w-full px-4 md:px-6 py-6 max-w-[1400px] mx-auto animate-fade-in">
      {title && <h2 className="text-3xl font-black uppercase tracking-wide text-white mb-6">{title}</h2>}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="group flex flex-col"
          >
            {/* Image Container */}
            <div 
              className="relative aspect-[3/4] overflow-hidden rounded-lg bg-blk-800 mb-3 cursor-pointer"
              onClick={() => onProductClick(product)}
            >
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col flex-grow">
              <h3 className="text-[13px] font-bold text-gray-200 uppercase tracking-tight leading-tight mb-1 truncate">
                {product.name}
              </h3>
              <div className="flex justify-between items-baseline mb-3">
                 <span className="text-[13px] font-bold text-white">
                  {product.price} PLN
                </span>
              </div>
              
              {/* Add To Cart Button - Matches Screenshot Style */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onProductClick(product);
                }}
                className="w-full border border-gray-600 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded hover:bg-white hover:text-black hover:border-white transition-all duration-200 mt-auto"
              >
                Dodaj do koszyka
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;