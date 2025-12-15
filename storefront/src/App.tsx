import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';
import CartView from './components/CartView';
import Sidebar from './components/Sidebar';
import { Product, CartItem, ViewState } from './types/types';

// 8 products from uploaded images
const ALL_PRODUCTS: Product[] = [
  // Women (4 products)
  {
    id: 1,
    name: "DRES KHAKI",
    subCategory: "KOBIETY",
    price: 449,
    category: 'women',
    color: "KHAKI",
    image: "/images/products/dres-khaki-kobieta.png"
  },
  {
    id: 2,
    name: "SZARA BLUZA",
    subCategory: "KOBIETY",
    price: 249,
    category: 'women',
    color: "SZARY",
    image: "/images/products/szara-bluza-kobieta.png"
  },
  {
    id: 3,
    name: "DRES GRAFITOWY",
    subCategory: "KOBIETY",
    price: 399,
    category: 'women',
    color: "GRAFITOWY",
    image: "/images/products/dres-grafitowy-kobieta.png"
  },
  {
    id: 4,
    name: "TSHIRT CZARNY",
    subCategory: "KOBIETY",
    price: 139,
    category: 'women',
    color: "CZARNY",
    image: "/images/products/tshirt-czarny-kobieta.png"
  },
  // Men (4 products)
  {
    id: 5,
    name: "DRES CZARNY",
    subCategory: "MĘŻCZYŹNI",
    price: 449,
    category: 'men',
    color: "CZARNY",
    image: "/images/products/dres-czarny-mezczyzna.png"
  },
  {
    id: 6,
    name: "KURTKA JEANSOWA CZARNA",
    subCategory: "MĘŻCZYŹNI",
    price: 329,
    category: 'men',
    color: "CZARNY",
    image: "/images/products/kurtka-jeansowa-mezczyzna.jpg"
  },
  {
    id: 7,
    name: "TSHIRT CZARNY",
    subCategory: "MĘŻCZYŹNI",
    price: 149,
    category: 'men',
    color: "CZARNY",
    image: "/images/products/tshirt-czarny-mezczyzna.png"
  },
  {
    id: 8,
    name: "BLUZA KHAKI",
    subCategory: "MĘŻCZYŹNI",
    price: 279,
    category: 'men',
    color: "KHAKI",
    image: "/images/products/bluza-khaki-mezczyzna.jpg"
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