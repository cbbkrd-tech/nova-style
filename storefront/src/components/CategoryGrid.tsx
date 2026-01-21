import React from 'react';
import { getSubcategoriesByCategory, SubcategoryDefinition } from '../constants/subcategories';

interface CategoryGridProps {
  category: 'women' | 'men';
  onSubcategoryClick: (slug: string) => void;
  onBackClick: () => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ category, onSubcategoryClick, onBackClick }) => {
  const subcategories = getSubcategoriesByCategory(category);
  const categoryTitle = category === 'women' ? 'DAMSKIE' : 'MĘSKIE';

  return (
    <div className="w-full bg-off-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Breadcrumb */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={onBackClick}
            className="text-sm text-charcoal/60 hover:text-charcoal transition-colors"
          >
            &larr; Strona główna
          </button>
          <span className="text-sm text-charcoal/40 mx-2">/</span>
          <span className="text-sm text-charcoal font-medium">{categoryTitle.charAt(0) + categoryTitle.slice(1).toLowerCase()}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-serif tracking-[0.1em] text-charcoal mb-6 md:mb-8 text-center md:text-left">
          {categoryTitle}
        </h1>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {subcategories.map((sub) => (
            <CategoryTile
              key={sub.slug}
              subcategory={sub}
              onClick={() => onSubcategoryClick(sub.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface CategoryTileProps {
  subcategory: SubcategoryDefinition;
  onClick: () => void;
}

const CategoryTile: React.FC<CategoryTileProps> = ({ subcategory, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square overflow-hidden bg-product-bg cursor-pointer"
    >
      {/* Image - text is already on the images */}
      {subcategory.image && (
        <img
          src={subcategory.image}
          alt={subcategory.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
    </button>
  );
};

export default CategoryGrid;
