import React from 'react';
import { MenuIcon, ShoppingCartIcon } from './Icons';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
  currentCategory: string;
  onCategoryClick: (cat: 'men' | 'women') => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartCount, onCartClick, onMenuClick, onCategoryClick, currentCategory, onLogoClick }) => {
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

      <div className="max-w-[1400px] mx-auto">
        {/* Sub Navigation */}
        <nav className="flex justify-center space-x-16 py-4 text-[13px] font-medium tracking-widest uppercase text-gray-300">
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