import React, { useState } from 'react';
import { XIcon, ChevronDownIcon } from './Icons';
import { getSubcategoriesByCategory } from '../constants/subcategories';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: 'men' | 'women') => void;
  onSubcategorySelect: (category: 'men' | 'women', subSlug: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onCategorySelect,
  onSubcategorySelect
}) => {
  const [expandedCategory, setExpandedCategory] = useState<'women' | 'men' | null>(null);

  if (!isOpen) return null;

  const renderCategory = (category: 'women' | 'men', label: string) => {
    const subcategories = getSubcategoriesByCategory(category);
    const isExpanded = expandedCategory === category;

    return (
      <div className="border-b border-gray-700">
        <button
          onClick={() => setExpandedCategory(isExpanded ? null : category)}
          className="w-full flex items-center justify-between py-4 text-xl font-medium uppercase tracking-widest text-white hover:text-gray-400 transition-colors"
        >
          {label}
          <ChevronDownIcon
            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {isExpanded && (
          <div className="pb-4 pl-4 space-y-1">
            <button
              onClick={() => {
                onCategorySelect(category);
                onClose();
              }}
              className="block w-full text-left text-sm text-white hover:text-gray-300 py-2 font-medium"
            >
              Wszystkie {label}
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub.slug}
                onClick={() => {
                  onSubcategorySelect(category, sub.slug);
                  onClose();
                }}
                className="block w-full text-left text-sm text-gray-400 hover:text-white py-2 transition-colors"
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Menu Content */}
      <div className="relative w-[80%] max-w-xs bg-[#26272B] h-full shadow-2xl flex flex-col border-r border-gray-700 overflow-y-auto">
        <div className="p-6 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl tracking-[0.1em] text-white" style={{ fontFamily: "'Playfair Display', serif" }}>MENU</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <XIcon />
          </button>
        </div>

        <nav className="flex flex-col p-6">
          {renderCategory('women', 'Kobiety')}
          {renderCategory('men', 'Mężczyźni')}
        </nav>

        <div className="mt-auto p-6 text-xs text-gray-500" style={{ fontFamily: "'Playfair Display', serif" }}>
          &copy; 2026 NOVA STYLE
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
