import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';
import Footer from './components/Footer';
import CartView from './components/CartView';
import Sidebar from './components/Sidebar';
import { Product, CartItem, ViewState } from './types/types';
import { supabase } from './lib/medusa';

// Fallback products in case Supabase fails
const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, name: "DRES KHAKI", subCategory: "KOBIETY", price: 449, category: 'women', color: "KHAKI", image: "/images/products/dres-khaki-kobieta.png" },
  { id: 2, name: "SZARA BLUZA", subCategory: "KOBIETY", price: 249, category: 'women', color: "SZARY", image: "/images/products/szara-bluza-kobieta.png" },
  { id: 3, name: "DRES GRAFITOWY", subCategory: "KOBIETY", price: 399, category: 'women', color: "GRAFITOWY", image: "/images/products/dres-grafitowy-kobieta.png" },
  { id: 4, name: "TSHIRT CZARNY", subCategory: "KOBIETY", price: 139, category: 'women', color: "CZARNY", image: "/images/products/tshirt-czarny-kobieta.png" },
  { id: 5, name: "DRES CZARNY", subCategory: "MĘŻCZYŹNI", price: 449, category: 'men', color: "CZARNY", image: "/images/products/dres-czarny-mezczyzna.png" },
  { id: 6, name: "KURTKA JEANSOWA CZARNA", subCategory: "MĘŻCZYŹNI", price: 329, category: 'men', color: "CZARNY", image: "/images/products/kurtka-jeansowa-mezczyzna.jpg" },
  { id: 7, name: "TSHIRT CZARNY", subCategory: "MĘŻCZYŹNI", price: 149, category: 'men', color: "CZARNY", image: "/images/products/tshirt-czarny-mezczyzna.png" },
  { id: 8, name: "BLUZA KHAKI", subCategory: "MĘŻCZYŹNI", price: 279, category: 'men', color: "KHAKI", image: "/images/products/bluza-khaki-mezczyzna.jpg" },
];

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [previousView, setPreviousView] = useState<ViewState>('home');
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  // Handle URL hash for product deep linking
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#product/')) {
      const productId = hash.replace('#product/', '');
      setPendingProductId(productId);
    } else if (hash === '#cart') {
      setCurrentView('cart');
    } else if (hash === '#women') {
      setCurrentView('women');
    } else if (hash === '#men') {
      setCurrentView('men');
    }
  }, []);

  // Open product when products are loaded and we have a pending product ID
  useEffect(() => {
    if (pendingProductId && products.length > 0 && !loading) {
      const product = products.find(p => p.supabaseId === pendingProductId || String(p.id) === pendingProductId);
      if (product) {
        setSelectedProduct(product);
        setCurrentView('product');
      }
      setPendingProductId(null);
    }
  }, [pendingProductId, products, loading]);

  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error('Supabase error:', error);
          return;
        }

        if (data && data.length > 0) {
          // Map Supabase products to our Product interface
          const mappedProducts = data.map((p, index) => ({
            id: index + 1,
            supabaseId: p.id, // Store original UUID for variant lookup
            name: p.name,
            price: p.price / 100, // Convert from grosze to PLN
            image: p.image_url || '/images/products/placeholder.png',
            category: p.category as 'men' | 'women',
            subCategory: p.category === 'women' ? 'KOBIETY' : 'MĘŻCZYŹNI',
            color: p.color,
            description: p.description,
            showOnHomepage: p.show_on_homepage ?? true,
          }));
          setProducts(mappedProducts as any);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Helper to filter products based on category selection
  const getVisibleProducts = () => {
    if (currentView === 'men') return products.filter(p => p.category === 'men');
    if (currentView === 'women') return products.filter(p => p.category === 'women');
    // Homepage shows only products marked for homepage
    return products.filter(p => (p as any).showOnHomepage !== false);
  };

  const handleCategoryChange = (category: 'men' | 'women') => {
    setCurrentView(category);
    setIsMenuOpen(false);
    window.location.hash = category;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductClick = (product: Product) => {
    setPreviousView(currentView);
    setSelectedProduct(product);
    setCurrentView('product');
    window.location.hash = `product/${product.supabaseId || product.id}`;
    window.scrollTo(0, 0);
  };

  const handleBackFromProduct = () => {
    setSelectedProduct(null);
    setCurrentView(previousView);
    window.location.hash = previousView === 'home' ? '' : previousView;
    window.scrollTo(0, 0);
  };

  const handleAddToCart = (product: Product, size: string = 'M', qty: number = 1) => {
    // Check if same product with same size already in cart
    const existing = cartItems.find(item => item.id === product.id && item.selectedSize === size);
    if (existing) {
      handleUpdateQuantity(existing.cartId, qty);
    } else {
      const newItem: CartItem = {
        ...product,
        cartId: `new_${Date.now()}`,
        quantity: qty,
        selectedSize: size,
      };
      setCartItems([...cartItems, newItem]);
    }
    // Stay on product page, go back to previous view
    setSelectedProduct(null);
    setCurrentView(previousView);
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
    <div className="min-h-screen bg-[#37393D] text-white font-sans selection:bg-white selection:text-black flex flex-col">

        <Sidebar
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onCategorySelect={handleCategoryChange}
        />

        <Header
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          onCartClick={() => { setCurrentView('cart'); window.location.hash = 'cart'; window.scrollTo(0, 0); }}
          onMenuClick={() => setIsMenuOpen(true)}
          onCategoryClick={handleCategoryChange}
          onLogoClick={() => {
            setCurrentView('home');
            setSelectedProduct(null);
            window.location.hash = '';
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
          ) : currentView === 'product' && selectedProduct ? (
            <ProductDetail
              product={selectedProduct}
              onBack={handleBackFromProduct}
              onAddToCart={handleAddToCart}
            />
          ) : (
            <>
              {currentView === 'home' && (
                <Hero onCategoryClick={handleCategoryChange} />
              )}

              <div id="product-grid">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <ProductGrid
                    products={getVisibleProducts()}
                    onProductClick={handleProductClick}
                    categoryTitle={currentView === 'men' ? 'MĘŻCZYŹNI' : currentView === 'women' ? 'KOBIETY' : undefined}
                  />
                )}
              </div>
            </>
          )}
        </main>

        <Footer />
    </div>
  );
}

export default App;
