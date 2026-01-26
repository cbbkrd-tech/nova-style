import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, ShoppingCartIcon, ChevronDownIcon, HeartIcon, UserIcon, FacebookIcon, InstagramIcon } from './Icons';
import { getSubcategoriesByCategory } from '../constants/subcategories';

// Hardcoded brands - same as in database
const BRANDS = [
  { slug: 'olavoga', name: 'OLAVOGA' },
  { slug: 'bg', name: 'BG' },
  { slug: 'la-manuel', name: 'La Manuel' },
];

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
  currentCategory: string;
  currentSubcategory?: string;
  currentBrand?: string;
  onCategoryClick: (cat: 'men' | 'women') => void;
  onSubcategoryClick: (cat: 'men' | 'women', subSlug: string) => void;
  onBrandClick?: (brandSlug: string) => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  cartCount,
  onCartClick,
  onMenuClick,
  onCategoryClick,
  onSubcategoryClick,
  onBrandClick,
  currentCategory,
  currentSubcategory,
  currentBrand,
  onLogoClick
}) => {
  const [openDropdown, setOpenDropdown] = useState<'women' | 'men' | 'brands' | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideDesktop = desktopNavRef.current?.contains(target);
      const isInsideMobile = mobileNavRef.current?.contains(target);
      if (!isInsideDesktop && !isInsideMobile) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const womenSubcategories = getSubcategoriesByCategory('women');
  const menSubcategories = getSubcategoriesByCategory('men');

  const navItems = [
    { label: 'DAMSKIE', action: () => onCategoryClick('women'), dropdown: 'women' as const, subcategories: womenSubcategories },
    { label: 'MĘSKIE', action: () => onCategoryClick('men'), dropdown: 'men' as const, subcategories: menSubcategories },
    { label: 'MARKI', action: () => {}, dropdown: 'brands' as const, brands: BRANDS },
  ];

  const renderNavItem = (item: typeof navItems[0], index: number) => {
    // Handle brands dropdown
    if (item.dropdown === 'brands' && item.brands) {
      return (
        <div key={index} className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'brands' ? null : 'brands')}
            onMouseEnter={() => setOpenDropdown('brands')}
            className={`nav-link text-charcoal hover:text-charcoal/70 ${
              currentBrand ? 'font-medium' : ''
            }`}
          >
            {item.label}
          </button>

          {openDropdown === 'brands' && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 bg-white border border-light-grey shadow-lg z-50"
              onMouseLeave={() => setOpenDropdown(null)}
            >
              {item.brands.map((brand) => (
                <button
                  key={brand.slug}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBrandClick?.(brand.slug);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-off-white transition-colors ${
                    currentBrand === brand.slug ? 'text-charcoal bg-off-white font-medium' : 'text-charcoal/70'
                  }`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Handle category dropdowns (women/men)
    if (item.dropdown && item.subcategories) {
      return (
        <div key={index} className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === item.dropdown ? null : item.dropdown!)}
            onMouseEnter={() => setOpenDropdown(item.dropdown!)}
            className={`nav-link text-charcoal hover:text-charcoal/70 ${
              currentCategory === item.dropdown ? 'font-medium' : ''
            }`}
          >
            {item.label}
          </button>

          {openDropdown === item.dropdown && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-56 bg-white border border-light-grey shadow-lg z-50"
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                onClick={() => {
                  item.action();
                  setOpenDropdown(null);
                }}
                className="w-full px-4 py-3 text-left text-sm text-charcoal hover:bg-off-white border-b border-light-grey font-medium"
              >
                Wszystkie {item.label.toLowerCase()}
              </button>
              <div className="max-h-80 overflow-y-auto">
                {item.subcategories.map((sub) => (
                  <button
                    key={sub.slug}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSubcategoryClick(item.dropdown as 'women' | 'men', sub.slug);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-off-white transition-colors ${
                      currentSubcategory === sub.slug ? 'text-charcoal bg-off-white font-medium' : 'text-charcoal/70'
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
    }

    // All nav items have dropdowns now, this fallback shouldn't be reached
    return null;
  };

  return (
    <div className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'header-scrolled' : ''}`}>
      {/* Top Bar - Beige */}
      <div className="bg-warm-beige py-2 text-center">
        <span className="text-xs md:text-sm text-charcoal tracking-wide">
          Darmowy odbiór osobisty na terenie Nowej Soli
        </span>
      </div>

      {/* Main Header - Off White */}
      <div className="bg-off-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          {/* Top Row: Menu (mobile) | Logo | Icons */}
          <header className="py-3 md:py-3 flex items-center justify-between relative min-h-[80px] md:min-h-[100px]">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="md:hidden text-charcoal hover:text-charcoal/70 p-1"
            >
              <MenuIcon />
            </button>

            {/* Spacer for desktop */}
            <div className="hidden md:block w-32"></div>

            {/* Centered Logo */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer text-center"
              onClick={onLogoClick}
            >
              <img
                src="/images/logo/Logo-no-bg.png"
                alt="NS"
                className="h-16 md:h-16 w-auto mx-auto"
              />
              <h1 className="text-base md:text-lg tracking-[0.15em] text-charcoal leading-none -mt-3 font-serif">
                NOVA STYLE
              </h1>
              <p className="text-[7px] md:text-[8px] tracking-[0.2em] text-charcoal/50 font-serif">
                FASHION BOUTIQUE
              </p>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-3 md:gap-4">
              <button className="hidden md:block text-charcoal hover:text-charcoal/70 transition-transform hover:scale-110">
                <UserIcon />
              </button>
              <button className="hidden md:block text-charcoal hover:text-charcoal/70 transition-transform hover:scale-110">
                <HeartIcon />
              </button>
              <button
                onClick={onCartClick}
                className="text-charcoal hover:text-charcoal/70 transition-transform hover:scale-110"
              >
                <ShoppingCartIcon count={cartCount} />
              </button>
              <div className="hidden md:flex items-center gap-2 ml-2 pl-4 border-l border-light-grey">
                <a
                  href="https://www.facebook.com/NovaStyleButik"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-charcoal hover:text-charcoal/70 transition-transform hover:scale-110"
                >
                  <FacebookIcon />
                </a>
                <a
                  href="https://www.instagram.com/novastylebutik/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-charcoal hover:text-charcoal/70 transition-transform hover:scale-110"
                >
                  <InstagramIcon />
                </a>
              </div>
            </div>
          </header>
        </div>

        {/* Separator Line */}
        <div className="w-full h-px bg-light-grey"></div>

        {/* Navigation Menu - Desktop Only */}
        <div className="max-w-[1400px] mx-auto px-6 hidden md:block" ref={desktopNavRef}>
          <nav className="flex justify-center items-center gap-8 lg:gap-12 py-4 text-[11px] lg:text-[12px] font-medium tracking-[0.15em]">
            {navItems.map((item, index) => renderNavItem(item, index))}
          </nav>
        </div>

        {/* Mobile Navigation - Category Buttons with Dropdowns */}
        <div className="md:hidden px-4 py-3 border-t border-light-grey" ref={mobileNavRef}>
          <nav className="flex justify-center gap-8 text-[11px] font-medium tracking-[0.15em]">
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'women' ? null : 'women')}
                className={`transition-colors flex items-center gap-1 ${currentCategory === 'women' ? 'text-charcoal font-semibold' : 'text-charcoal/60 hover:text-charcoal'}`}
              >
                DAMSKIE
                <ChevronDownIcon />
              </button>
              {openDropdown === 'women' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-light-grey shadow-lg z-50">
                  <button
                    onClick={() => { onCategoryClick('women'); setOpenDropdown(null); }}
                    className="w-full px-4 py-3 text-left text-sm text-charcoal hover:bg-off-white border-b border-light-grey font-medium"
                  >
                    Wszystkie damskie
                  </button>
                  <div className="max-h-60 overflow-y-auto">
                    {womenSubcategories.map((sub) => (
                      <button
                        key={sub.slug}
                        onClick={(e) => { e.stopPropagation(); onSubcategoryClick('women', sub.slug); setOpenDropdown(null); }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-off-white transition-colors ${
                          currentSubcategory === sub.slug ? 'text-charcoal bg-off-white font-medium' : 'text-charcoal/70'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'men' ? null : 'men')}
                className={`transition-colors flex items-center gap-1 ${currentCategory === 'men' ? 'text-charcoal font-semibold' : 'text-charcoal/60 hover:text-charcoal'}`}
              >
                MĘSKIE
                <ChevronDownIcon />
              </button>
              {openDropdown === 'men' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-light-grey shadow-lg z-50">
                  <button
                    onClick={() => { onCategoryClick('men'); setOpenDropdown(null); }}
                    className="w-full px-4 py-3 text-left text-sm text-charcoal hover:bg-off-white border-b border-light-grey font-medium"
                  >
                    Wszystkie męskie
                  </button>
                  <div className="max-h-60 overflow-y-auto">
                    {menSubcategories.map((sub) => (
                      <button
                        key={sub.slug}
                        onClick={(e) => { e.stopPropagation(); onSubcategoryClick('men', sub.slug); setOpenDropdown(null); }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-off-white transition-colors ${
                          currentSubcategory === sub.slug ? 'text-charcoal bg-off-white font-medium' : 'text-charcoal/70'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'brands' ? null : 'brands')}
                className={`transition-colors flex items-center gap-1 ${currentBrand ? 'text-charcoal font-semibold' : 'text-charcoal/60 hover:text-charcoal'}`}
              >
                MARKI
                <ChevronDownIcon />
              </button>
              {openDropdown === 'brands' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-light-grey shadow-lg z-50">
                  <div className="max-h-60 overflow-y-auto">
                    {BRANDS.map((brand) => (
                      <button
                        key={brand.slug}
                        onClick={(e) => { e.stopPropagation(); onBrandClick?.(brand.slug); setOpenDropdown(null); }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-off-white transition-colors ${
                          currentBrand === brand.slug ? 'text-charcoal bg-off-white font-medium' : 'text-charcoal/70'
                        }`}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Header;
