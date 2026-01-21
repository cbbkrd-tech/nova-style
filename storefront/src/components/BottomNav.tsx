import React from 'react';
import { ViewState } from '../types/types';

interface BottomNavProps {
  currentView: ViewState;
  cartCount: number;
  onChangeView: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, cartCount, onChangeView }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-off-white border-t border-light-grey">
      <div className="flex justify-around items-center py-3">
        <button
          onClick={() => onChangeView('home')}
          className={`flex flex-col items-center transition-colors ${currentView === 'home' ? 'text-charcoal' : 'text-charcoal/40'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>

        <button className="flex flex-col items-center text-charcoal/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <button
          onClick={() => onChangeView('cart')}
          className={`flex flex-col items-center relative transition-colors ${currentView === 'cart' ? 'text-charcoal' : 'text-charcoal/40'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-warm-beige text-charcoal text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        <button className="flex flex-col items-center text-charcoal/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
