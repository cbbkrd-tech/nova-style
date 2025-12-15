import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';
import CartView from './components/CartView';
import Sidebar from './components/Sidebar';
import { Product, CartItem, ViewState } from './types';

// Updated Product Data matching the 12 specific looks from the collage
const ALL_PRODUCTS: Product[] = [
  // --- ROW 1 (Women) ---
  { 
    id: 1, 
    name: "CROP HOODIE - KHAKI", 
    subCategory: "KOBIETY", 
    price: 249, 
    category: 'women', 
    color: "KHAKI", 
    image: "image.png" 
  },
  { 
    id: 2, 
    name: "GRAPHIC TEE - OVERSIZE", 
    subCategory: "KOBIETY", 
    price: 139, 
    category: 'women', 
    color: "CZARNY", 
    image: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    id: 3, 
    name: "ZIP HOODIE - GREY", 
    subCategory: "KOBIETY", 
    price: 279, 
    category: 'women', 
    color: "SZARY", 
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    id: 4, 
    name: "LONGSLEEVE CROP - CHARCOAL", 
    subCategory: "KOBIETY", 
    price: 159, 
    category: 'women', 
    color: "CHARCOAL", 
    image: "https://images.unsplash.com/photo-1519415510236-718bdfcd4788?auto=format&fit=crop&w=800&q=80" 
  },

  // --- ROW 2 (Men) ---
  { 
    id: 5, 
    name: "HOODIE SET - TAUPE", 
    subCategory: "MĘŻCZYŹNI", 
    price: 449, 
    category: 'men', 
    color: "TAUPE", 
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    id: 6, 
    name: "DENIM JACKET - BLACK", 
    subCategory: "MĘŻCZYŹNI", 
    price: 329, 
    category: 'men', 
    color: "CZARNY", 
    image: "https://images.unsplash.com/photo-1601933973783-43cf8a7d4c5f?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    id: 7, 
    name: "BOMBER JACKET - NAVY", 
    subCategory: "MĘŻCZYŹNI", 
    price: 289, 
    category: 'men', 
    color: "NAVY", 
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    id: 8, 
    name: "FLANNEL SHIRT - RED", 
    subCategory: "MĘŻCZYŹNI", 
    price: 199, 
    category: 'men', 
    color: "RED", 
    image: "https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&w=800&q=80" 
  },

  // --- ROW 3 (Mixed) ---
  { 
    id: 9, 
    name: "ZIP HOODIE - BLACK", 
    subCategory: "KOBIETY", 
    price: 269, 
    category: 'women', 
    color: "CZARNY", 
    image: "https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    id: 10, 
    name: "DENIM JACKET - BLUE", 
    subCategory: "KOBIETY", 
    price: 299, 
    category: 'women', 
    color: "BLUE", 
    image: "https://images.unsplash.com/photo-1527016021513-b09758b777d4?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    id: 11, 
    name: "ZIP HOODIE - NAVY", 
    subCategory: "MĘŻCZYŹNI", 
    price: 259, 
    category: 'men', 
    color: "NAVY", 
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    id: 12, 
    name: "CREWNECK SET - GREY", 
    subCategory: "MĘŻCZYŹNI", 
    price: 339, 
    category: 'men', 
    color: "SZARY", 
    image: "https://images.unsplash.com/photo-1617137968427-b57427285c94?auto=format&fit=crop&w=800&q=80" 
  },
];

const INITIAL_CART: CartItem[] = [];

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home'); 
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper to filter products based on category selection
  const getVisibleProducts = () => {
    if (currentView === 'men') return ALL_PRODUCTS.filter(p => p.category === 'men');
    if (currentView === 'women') return ALL_PRODUCTS.filter(p => p.category === 'women');
    
    // 'home' returns all products
    return ALL_PRODUCTS; 
  };

  const handleCategoryChange = (category: 'men' | 'women') => {
    setCurrentView(category);
    setIsMenuOpen(false); // Close menu if open
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product) => {
    const existing = cartItems.find(item => item.id === product.id);
    if (existing) {
      handleUpdateQuantity(existing.cartId, 1);
    } else {
      const newItem: CartItem = {
        ...product,
        cartId: `new_${Date.now()}`,
        quantity: 1,
        selectedSize: 'M',
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleRemoveItem = (cartId: string) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  };

  const isCartView = currentView === 'cart';

  return (
    <div className="min-h-screen bg-[#222222] text-white font-sans selection:bg-white selection:text-black flex flex-col">
        
        <Sidebar 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          onCategorySelect={handleCategoryChange} 
        />

        <Header 
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
          onCartClick={() => setCurrentView('cart')}
          onMenuClick={() => setIsMenuOpen(true)} 
          onCategoryClick={handleCategoryChange}
          onLogoClick={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currentCategory={currentView !== 'cart' && currentView !== 'home' ? currentView : ''}
        />

        <main className="flex-grow">
          {isCartView ? (
             <div className="max-w-[1400px] mx-auto w-full">
              <button 
                onClick={() => setCurrentView('home')} 
                className="mt-6 ml-6 text-sm text-gray-400 hover:text-white"
              >
                &larr; Powrót do sklepu
              </button>
              <CartView 
                items={cartItems} 
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />
            </div>
          ) : (
            <>
              {/* Hero Section - Only shown on Home view */}
              {currentView === 'home' && (
                <Hero onCategoryClick={handleCategoryChange} />
              )}
              
              {/* Product Row */}
              <div id="product-grid">
                <ProductGrid 
                  products={getVisibleProducts()} 
                  onProductClick={handleAddToCart}
                />
              </div>
            </>
          )}
        </main>

        <Footer />
    </div>
  );
}

export default App;