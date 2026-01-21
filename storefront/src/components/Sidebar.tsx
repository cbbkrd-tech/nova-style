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
      <div className="border-b border-light-grey">
        <button
          onClick={() => setExpandedCategory(isExpanded ? null : category)}
          className="w-full flex items-center justify-between py-4 text-lg font-medium uppercase tracking-widest text-charcoal hover:text-charcoal/70 transition-colors"
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
              className="block w-full text-left text-sm text-charcoal hover:text-charcoal/70 py-2 font-medium"
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
                className="block w-full text-left text-sm text-charcoal/60 hover:text-charcoal py-2 transition-colors"
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Menu Content */}
      <div className="relative w-[80%] max-w-xs bg-off-white h-full shadow-2xl flex flex-col border-r border-light-grey overflow-y-auto animate-slide-in">
        <div className="p-6 flex justify-between items-center border-b border-light-grey">
          <h2 className="text-xl tracking-[0.1em] text-charcoal font-serif">MENU</h2>
          <button onClick={onClose} className="text-charcoal hover:text-charcoal/70">
            <XIcon />
          </button>
        </div>

        <nav className="flex flex-col p-6">
          {renderCategory('women', 'Kobiety')}
          {renderCategory('men', 'Mężczyźni')}
        </nav>

        <div className="mt-auto p-6 text-xs text-charcoal/40 font-serif">
          &copy; 2026 NOVA STYLE
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
