import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, ShoppingCartIcon, ChevronDownIcon } from './Icons';
import { getSubcategoriesByCategory } from '../constants/subcategories';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
  currentCategory: string;
  currentSubcategory?: string;
  onCategoryClick: (cat: 'men' | 'women') => void;
  onSubcategoryClick: (cat: 'men' | 'women', subSlug: string) => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  cartCount,
  onCartClick,
  onMenuClick,
  onCategoryClick,
  onSubcategoryClick,
  currentCategory,
  currentSubcategory,
  onLogoClick
}) => {
  const [openDropdown, setOpenDropdown] = useState<'women' | 'men' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const womenSubcategories = getSubcategoriesByCategory('women');
  const menSubcategories = getSubcategoriesByCategory('men');

  const renderCategoryDropdown = (
    category: 'women' | 'men',
    label: string,
    subcategories: typeof womenSubcategories
  ) => (
    <div className="relative">
      <button
        onClick={() => onCategoryClick(category)}
        onMouseEnter={() => setOpenDropdown(category)}
        className={`flex items-center gap-1 transition-colors duration-200 ${
          currentCategory === category ? 'text-white' : 'hover:text-white'
        }`}
      >
        {label}
        <ChevronDownIcon className="w-3 h-3" />
      </button>

      {openDropdown === category && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-56 bg-[#26272B] border border-gray-700 shadow-xl z-50"
          onMouseLeave={() => setOpenDropdown(null)}
        >
          <button
            onClick={() => {
              onCategoryClick(category);
              setOpenDropdown(null);
            }}
            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-700 border-b border-gray-700 font-medium"
          >
            Wszystkie {label}
          </button>
          <div className="max-h-80 overflow-y-auto">
            {subcategories.map((sub) => (
              <button
                key={sub.slug}
                onClick={() => {
                  onSubcategoryClick(category, sub.slug);
                  setOpenDropdown(null);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-700 transition-colors ${
                  currentSubcategory === sub.slug ? 'text-white bg-gray-700' : 'text-gray-300'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="sticky top-0 z-50 bg-[#26272B] shadow-lg">
      <div className="max-w-[1400px] mx-auto">
        {/* Top Bar */}
        <header className="px-6 py-5 flex items-center justify-between">
          <button onClick={onMenuClick} className="text-white hover:text-gray-300">
            <MenuIcon />
          </button>

          <div className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer text-center" onClick={onLogoClick}>
            <h1 className="text-2xl tracking-[0.15em] text-white leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              NOVA STYLE
            </h1>
            <p className="text-[10px] tracking-[0.3em] text-gray-400 mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              FASHION BOUTIQUE
            </p>
          </div>

          <div className="flex items-center">
            <button onClick={onCartClick} className="text-white hover:text-gray-300 relative">
              <ShoppingCartIcon count={cartCount} />
            </button>
          </div>
        </header>
      </div>

      {/* Full-width separator line */}
      <div className="w-full h-px bg-gray-700"></div>

      <div className="max-w-[1400px] mx-auto" ref={dropdownRef}>
        {/* Sub Navigation with dropdowns */}
        <nav className="hidden md:flex justify-center space-x-16 py-4 text-[13px] font-medium tracking-widest uppercase text-gray-300">
          {renderCategoryDropdown('women', 'Kobiety', womenSubcategories)}
          {renderCategoryDropdown('men', 'Mężczyźni', menSubcategories)}
        </nav>
        {/* Mobile - simple buttons without dropdown */}
        <nav className="flex md:hidden justify-center space-x-16 py-4 text-[13px] font-medium tracking-widest uppercase text-gray-300">
          <button
            onClick={() => onCategoryClick('women')}
            className={`transition-colors duration-200 ${currentCategory === 'women' ? 'text-white' : 'hover:text-white'}`}
          >
            Kobiety
          </button>
          <button
            onClick={() => onCategoryClick('men')}
            className={`transition-colors duration-200 ${currentCategory === 'men' ? 'text-white' : 'hover:text-white'}`}
          >
            Mężczyźni
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Header;
