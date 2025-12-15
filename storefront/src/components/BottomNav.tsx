import React from 'react';
import { HomeIcon, SearchIcon, ShoppingCartIcon, UserIcon } from './Icons';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-blk-900 border-t border-blk-700 pb-safe">
      <div className="max-w-md mx-auto flex justify-between items-center px-8 py-4">
        <button 
          onClick={() => onChangeView('men')} 
          className="flex flex-col items-center"
        >
          <HomeIcon active={currentView === 'men' || currentView === 'women'} />
        </button>
        
        <button 
          onClick={() => onChangeView('women')} /* Using search icon to switch to women for demo purposes */
          className="flex flex-col items-center"
        >
           <SearchIcon />
        </button>
        
        <button 
          onClick={() => onChangeView('cart')} 
          className="flex flex-col items-center"
        >
          <div className={`${currentView === 'cart' ? 'text-white' : 'text-[#666]'}`}>
             <ShoppingCartIcon count={0} /> {/* Simplified for bottom nav */}
          </div>
        </button>
        
        <button className="flex flex-col items-center">
          <UserIcon />
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;