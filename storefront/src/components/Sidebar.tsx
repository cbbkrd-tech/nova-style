import React from 'react';
import { XIcon } from './Icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: 'men' | 'women') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onCategorySelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Menu Content */}
      <div className="relative w-[80%] max-w-xs bg-[#1a1a1a] h-full shadow-2xl flex flex-col border-r border-blk-700">
        <div className="p-6 flex justify-between items-center border-b border-blk-700">
           <h2 className="text-xl font-black italic tracking-tighter text-white">MENU</h2>
           <button onClick={onClose} className="text-white hover:text-gray-300">
             <XIcon />
           </button>
        </div>
        
        <nav className="flex flex-col p-6 space-y-6">
          <button 
            onClick={() => onCategorySelect('women')}
            className="text-2xl font-bold uppercase tracking-widest text-white text-left hover:text-gray-400 transition-colors"
          >
            Kobiety
          </button>
          <button 
            onClick={() => onCategorySelect('men')}
            className="text-2xl font-bold uppercase tracking-widest text-white text-left hover:text-gray-400 transition-colors"
          >
            Mężczyźni
          </button>
        </nav>

         <div className="mt-auto p-6 text-xs text-gray-500">
            &copy; 2023 BLK/OUT Streetwear
         </div>
      </div>
    </div>
  );
};

export default Sidebar;