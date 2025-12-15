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
    <div className="sticky top-0 z-50 bg-[#1a1a1a] border-b border-blk-700 shadow-lg">
      <div className="max-w-[1400px] mx-auto">
        {/* Top Bar */}
        <header className="px-6 py-5 flex items-center justify-between">
          <button onClick={onMenuClick} className="text-white hover:text-gray-300">
            <MenuIcon />
          </button>
          
          <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2 cursor-pointer" onClick={onLogoClick}>
            <h1 className="text-3xl font-black tracking-tight text-white leading-none">
              NOVA STYLE
            </h1>
          </div>

          <div className="flex items-center">
            <button onClick={onCartClick} className="text-white hover:text-gray-300 relative">
              <ShoppingCartIcon count={cartCount} />
            </button>
          </div>
        </header>

        {/* Sub Navigation */}
        <nav className="flex justify-center space-x-16 pb-4 text-[13px] font-bold tracking-widest uppercase text-gray-300">
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