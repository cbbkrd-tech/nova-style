import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
const ProductDetail = lazy(() => import('./components/ProductDetail'));
import Footer from './components/Footer';
const CartView = lazy(() => import('./components/CartView'));
const CheckoutForm = lazy(() => import('./components/CheckoutForm'));
const PaymentStatus = lazy(() => import('./components/PaymentStatus'));
import Sidebar from './components/Sidebar';
import BenefitsBar from './components/BenefitsBar';
import BottomNav from './components/BottomNav';
import CategoryGrid from './components/CategoryGrid';
import { Product, CartItem, ViewState } from './types/types';
import { supabase } from './lib/medusa';
import { getSubcategoryBySlug } from './constants/subcategories';

// Fallback products in case Supabase fails
const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, name: "DRES KHAKI", price: 449, category: 'women', color: "KHAKI", image: "/images/products/dres-khaki-kobieta.png" },
  { id: 2, name: "SZARA BLUZA", price: 249, category: 'women', color: "SZARY", image: "/images/products/szara-bluza-kobieta.png" },
  { id: 3, name: "DRES GRAFITOWY", price: 399, category: 'women', color: "GRAFITOWY", image: "/images/products/dres-grafitowy-kobieta.png" },
  { id: 4, name: "TSHIRT CZARNY", price: 139, category: 'women', color: "CZARNY", image: "/images/products/tshirt-czarny-kobieta.png" },
  { id: 5, name: "DRES CZARNY", price: 449, category: 'men', color: "CZARNY", image: "/images/products/dres-czarny-mezczyzna.png" },
  { id: 6, name: "KURTKA JEANSOWA CZARNA", price: 329, category: 'men', color: "CZARNY", image: "/images/products/kurtka-jeansowa-mezczyzna.jpg" },
  { id: 7, name: "TSHIRT CZARNY", price: 149, category: 'men', color: "CZARNY", image: "/images/products/tshirt-czarny-mezczyzna.png" },
  { id: 8, name: "BLUZA KHAKI", price: 279, category: 'men', color: "KHAKI", image: "/images/products/bluza-khaki-mezczyzna.jpg" },
];

// Brand name mapping for display
const BRAND_NAMES: Record<string, string> = {
  'olavoga': 'OLAVOGA',
  'bg': 'Brandenburg BG',
  'la-manuel': 'La Manuel',
  'la-monne': 'La Monne',
  'la-mania': 'LA Mania',
  'mia-maison': 'Mia Maison',
  'millagro': 'Millagro',
  'lil-glam': 'Lil Glam',
};

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [currentSubcategory, setCurrentSubcategory] = useState<string | null>(null);
  const [currentBrand, setCurrentBrand] = useState<string | null>(null);
  const [brandGenderFilter, setBrandGenderFilter] = useState<'all' | 'women' | 'men'>('all');
  const [brandPriceSort, setBrandPriceSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('nova-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [previousView, setPreviousView] = useState<ViewState>('home');
  const [previousSubcategory, setPreviousSubcategory] = useState<string | null>(null);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  // Handle URL hash for product and category deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#product/')) {
        const productId = hash.replace('#product/', '');
        setPendingProductId(productId);
      } else if (hash === '#cart') {
        setCurrentView('cart');
        setSelectedProduct(null);
      } else if (hash === '#checkout') {
        setCurrentView('checkout');
        setSelectedProduct(null);
      } else if (hash.startsWith('#payment-success')) {
        setCurrentView('payment-success');
        setSelectedProduct(null);
      } else if (hash === '#payment-cancelled') {
        setCurrentView('payment-cancelled');
        setSelectedProduct(null);
      } else if (hash === '#payment-error') {
        setCurrentView('payment-error');
        setSelectedProduct(null);
      } else if (hash === '#women-categories') {
        setCurrentView('women-categories');
        setCurrentSubcategory(null);
        setSelectedProduct(null);
      } else if (hash === '#men-categories') {
        setCurrentView('men-categories');
        setCurrentSubcategory(null);
        setSelectedProduct(null);
      } else if (hash.startsWith('#women/')) {
        const subSlug = hash.replace('#women/', '');
        setCurrentView('women');
        setCurrentSubcategory(subSlug);
        setSelectedProduct(null);
      } else if (hash.startsWith('#men/')) {
        const subSlug = hash.replace('#men/', '');
        setCurrentView('men');
        setCurrentSubcategory(subSlug);
        setSelectedProduct(null);
      } else if (hash === '#women') {
        setCurrentView('women');
        setCurrentSubcategory(null);
        setSelectedProduct(null);
      } else if (hash === '#men') {
        setCurrentView('men');
        setCurrentSubcategory(null);
        setSelectedProduct(null);
      } else if (hash.startsWith('#brand/')) {
        const brandSlug = hash.replace('#brand/', '');
        setCurrentView('brand');
        setCurrentBrand(brandSlug);
        setSelectedProduct(null);
      } else if (hash === '' || hash === '#') {
        setCurrentView('home');
        setCurrentSubcategory(null);
        setSelectedProduct(null);
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for browser back/forward navigation
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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

  // Fetch products from Supabase with subcategory and brand join
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            subcategory:subcategories(id, slug, name),
            brand:brands(id, slug, name)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          return;
        }

        if (data && data.length > 0) {
          // Map Supabase products to our Product interface
          const mappedProducts = data.map((p, index) => ({
            id: index + 1,
            supabaseId: p.id,
            name: p.name,
            price: p.price / 100,
            image: p.image_url || '/images/products/placeholder.png',
            category: p.category as 'men' | 'women',
            subcategoryId: p.subcategory_id,
            subcategorySlug: (p.subcategory as any)?.slug || null,
            subcategoryName: (p.subcategory as any)?.name || null,
            brandId: (p as any).brand_id,
            brandSlug: (p.brand as any)?.slug || null,
            brandName: (p.brand as any)?.name || null,
            color: p.color,
            description: p.description,
            sizeGuide: (p as any).size_guide,
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

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('nova-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Helper to filter products based on category, subcategory, and brand selection
  const getVisibleProducts = () => {
    let filtered = products;

    if (currentView === 'brand' && currentBrand) {
      // Filter by brand
      filtered = filtered.filter(p => p.brandSlug === currentBrand);
      // Apply gender filter
      if (brandGenderFilter !== 'all') {
        filtered = filtered.filter(p => p.category === brandGenderFilter);
      }
      // Apply price sort
      if (brandPriceSort === 'asc') {
        filtered = [...filtered].sort((a, b) => a.price - b.price);
      } else if (brandPriceSort === 'desc') {
        filtered = [...filtered].sort((a, b) => b.price - a.price);
      }
      return filtered;
    } else if (currentView === 'men') {
      filtered = filtered.filter(p => p.category === 'men');
    } else if (currentView === 'women') {
      filtered = filtered.filter(p => p.category === 'women');
    } else {
      // Homepage shows only products marked for homepage
      return filtered.filter(p => (p as any).showOnHomepage !== false);
    }

    // Filter by subcategory if selected
    if (currentSubcategory) {
      filtered = filtered.filter(p => p.subcategorySlug === currentSubcategory);
    }

    return filtered;
  };

  // Show category grid (from Hero click)
  const handleCategoryGridShow = (category: 'men' | 'women') => {
    setCurrentView(category === 'women' ? 'women-categories' : 'men-categories');
    setCurrentSubcategory(null);
    setIsMenuOpen(false);
    window.location.hash = `${category}-categories`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show all products in category (from header "Wszystkie damskie/męskie")
  const handleCategoryChange = (category: 'men' | 'women') => {
    setCurrentView(category);
    setCurrentSubcategory(null);
    setIsMenuOpen(false);
    window.location.hash = category;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubcategoryChange = (category: 'men' | 'women', subSlug: string) => {
    setCurrentView(category);
    setCurrentSubcategory(subSlug);
    setCurrentBrand(null);
    setIsMenuOpen(false);
    window.location.hash = `${category}/${subSlug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBrandSelect = (brandSlug: string) => {
    setCurrentView('brand');
    setCurrentBrand(brandSlug);
    setCurrentSubcategory(null);
    setBrandGenderFilter('all');
    setBrandPriceSort('none');
    setIsMenuOpen(false);
    window.location.hash = `brand/${brandSlug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductClick = (product: Product) => {
    setPreviousView(currentView);
    setPreviousSubcategory(currentSubcategory);
    setSelectedProduct(product);
    setCurrentView('product');
    window.location.hash = `product/${product.supabaseId || product.id}`;
    window.scrollTo(0, 0);
  };

  const handleBackFromProduct = () => {
    setSelectedProduct(null);
    setCurrentView(previousView);
    setCurrentSubcategory(previousSubcategory);
    if (previousView === 'home') {
      window.location.hash = '';
    } else if (previousSubcategory) {
      window.location.hash = `${previousView}/${previousSubcategory}`;
    } else {
      window.location.hash = previousView;
    }
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

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    if (view === 'home') {
      setCurrentSubcategory(null);
      setSelectedProduct(null);
      window.location.hash = '';
    } else if (view === 'cart') {
      window.location.hash = 'cart';
    } else if (view === 'checkout') {
      window.location.hash = 'checkout';
    }
    window.scrollTo(0, 0);
  };

  const handleCheckout = () => {
    setCurrentView('checkout');
    window.location.hash = 'checkout';
    window.scrollTo(0, 0);
  };

  const handlePaymentSuccess = (sessionId: string) => {
    // Clear cart on successful payment
    setCartItems([]);
    console.log('Payment initiated for session:', sessionId);
  };

  const isCartView = currentView === 'cart';
  const isCheckoutView = currentView === 'checkout';
  const isPaymentStatusView = currentView === 'payment-success' || currentView === 'payment-cancelled' || currentView === 'payment-error';

  // Calculate cart subtotal for checkout
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Get category title with optional subcategory or brand
  const getCategoryTitle = () => {
    if (currentView === 'brand' && currentBrand) {
      return BRAND_NAMES[currentBrand] || currentBrand.toUpperCase();
    }
    if (currentView === 'men') {
      if (currentSubcategory) {
        const sub = getSubcategoryBySlug(currentSubcategory);
        return sub ? `MĘŻCZYŹNI / ${sub.name.toUpperCase()}` : 'MĘŻCZYŹNI';
      }
      return 'MĘŻCZYŹNI';
    }
    if (currentView === 'women') {
      if (currentSubcategory) {
        const sub = getSubcategoryBySlug(currentSubcategory);
        return sub ? `KOBIETY / ${sub.name.toUpperCase()}` : 'KOBIETY';
      }
      return 'KOBIETY';
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-off-white text-charcoal font-sans flex flex-col">

        <Sidebar
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onCategorySelect={handleCategoryChange}
          onSubcategorySelect={handleSubcategoryChange}
          onBrandSelect={handleBrandSelect}
        />

        <Header
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          onCartClick={() => { setCurrentView('cart'); window.location.hash = 'cart'; window.scrollTo(0, 0); }}
          onMenuClick={() => setIsMenuOpen(true)}
          onCategoryClick={handleCategoryChange}
          onSubcategoryClick={handleSubcategoryChange}
          onBrandClick={handleBrandSelect}
          onLogoClick={() => {
            setCurrentView('home');
            setCurrentSubcategory(null);
            setCurrentBrand(null);
            setSelectedProduct(null);
            window.location.hash = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currentCategory={
            currentView === 'women' || currentView === 'women-categories' ? 'women' :
            currentView === 'men' || currentView === 'men-categories' ? 'men' : ''
          }
          currentSubcategory={currentSubcategory || undefined}
          currentBrand={currentBrand || undefined}
        />

        <main className="flex-grow pb-16 md:pb-0">
          {isPaymentStatusView ? (
            <Suspense fallback={<div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-charcoal"></div></div>}>
              <PaymentStatus
                status={currentView === 'payment-success' ? 'success' : currentView === 'payment-cancelled' ? 'cancelled' : 'error'}
                sessionId={localStorage.getItem('nova-pending-order') || undefined}
                onBackToShop={() => handleViewChange('home')}
              />
            </Suspense>
          ) : isCheckoutView ? (
            <Suspense fallback={<div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-charcoal"></div></div>}>
              <CheckoutForm
                items={cartItems}
                subtotal={subtotal}
                onBack={() => handleViewChange('cart')}
                onSuccess={handlePaymentSuccess}
              />
            </Suspense>
          ) : isCartView ? (
             <div className="w-full">
              <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                <button
                  onClick={() => handleViewChange('home')}
                  className="mt-6 text-sm text-charcoal/60 hover:text-charcoal transition-colors"
                >
                  &larr; Powrót do sklepu
                </button>
              </div>
              <Suspense fallback={<div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-charcoal"></div></div>}>
                <CartView
                  items={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onCheckout={handleCheckout}
                />
              </Suspense>
            </div>
          ) : currentView === 'product' && selectedProduct ? (
            <Suspense fallback={<div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-charcoal"></div></div>}>
              <ProductDetail
                product={selectedProduct}
                onBack={handleBackFromProduct}
                onAddToCart={handleAddToCart}
              />
            </Suspense>
          ) : (
            <>
              {currentView === 'home' && (
                <>
                  <Hero onCategoryClick={handleCategoryGridShow} />
                  <ProductGrid
                    products={getVisibleProducts().slice(0, 6)}
                    onProductClick={handleProductClick}
                  />
                  <BenefitsBar />
                </>
              )}

              {(currentView === 'women-categories' || currentView === 'men-categories') && (
                <>
                  <CategoryGrid
                    category={currentView === 'women-categories' ? 'women' : 'men'}
                    onSubcategoryClick={(slug) => handleSubcategoryChange(
                      currentView === 'women-categories' ? 'women' : 'men',
                      slug
                    )}
                    onBackClick={() => handleViewChange('home')}
                  />
                  <BenefitsBar />
                </>
              )}

              {(currentView === 'men' || currentView === 'women') && (
                <div id="product-grid">
                  {/* Breadcrumb Navigation */}
                  <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6 md:pt-8">
                    <div className="mb-4 md:mb-6">
                      <button
                        onClick={() => handleViewChange('home')}
                        className="text-sm text-charcoal/60 hover:text-charcoal transition-colors"
                      >
                        &larr; Strona główna
                      </button>
                      <span className="text-sm text-charcoal/40 mx-2">/</span>
                      {currentSubcategory ? (
                        <>
                          <button
                            onClick={() => handleCategoryGridShow(currentView as 'men' | 'women')}
                            className="text-sm text-charcoal/60 hover:text-charcoal transition-colors"
                          >
                            {currentView === 'women' ? 'Damskie' : 'Męskie'}
                          </button>
                          <span className="text-sm text-charcoal/40 mx-2">/</span>
                          <span className="text-sm text-charcoal font-medium">
                            {getSubcategoryBySlug(currentSubcategory)?.name || currentSubcategory}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-charcoal font-medium">
                          {currentView === 'women' ? 'Damskie' : 'Męskie'}
                        </span>
                      )}
                    </div>
                  </div>
                  {loading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-charcoal"></div>
                    </div>
                  ) : (
                    <ProductGrid
                      products={getVisibleProducts()}
                      onProductClick={handleProductClick}
                      categoryTitle={getCategoryTitle()}
                    />
                  )}
                </div>
              )}

              {currentView === 'brand' && currentBrand && (
                <div id="product-grid">
                  {/* Breadcrumb Navigation for Brand */}
                  <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6 md:pt-8">
                    <div className="mb-4 md:mb-6">
                      <button
                        onClick={() => handleViewChange('home')}
                        className="text-sm text-charcoal/60 hover:text-charcoal transition-colors"
                      >
                        &larr; Strona główna
                      </button>
                      <span className="text-sm text-charcoal/40 mx-2">/</span>
                      <span className="text-sm text-charcoal font-medium">
                        {BRAND_NAMES[currentBrand] || currentBrand}
                      </span>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      {/* Gender Filter */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-charcoal/60 uppercase tracking-wider">Płeć:</span>
                        <div className="flex border border-light-grey rounded overflow-hidden">
                          <button
                            onClick={() => setBrandGenderFilter('all')}
                            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                              brandGenderFilter === 'all'
                                ? 'bg-charcoal text-white'
                                : 'bg-white text-charcoal hover:bg-gray-100'
                            }`}
                          >
                            Wszystkie
                          </button>
                          <button
                            onClick={() => setBrandGenderFilter('women')}
                            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors border-l border-light-grey ${
                              brandGenderFilter === 'women'
                                ? 'bg-charcoal text-white'
                                : 'bg-white text-charcoal hover:bg-gray-100'
                            }`}
                          >
                            Damskie
                          </button>
                          <button
                            onClick={() => setBrandGenderFilter('men')}
                            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors border-l border-light-grey ${
                              brandGenderFilter === 'men'
                                ? 'bg-charcoal text-white'
                                : 'bg-white text-charcoal hover:bg-gray-100'
                            }`}
                          >
                            Męskie
                          </button>
                        </div>
                      </div>

                      {/* Price Sort */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-charcoal/60 uppercase tracking-wider">Cena:</span>
                        <div className="flex border border-light-grey rounded overflow-hidden">
                          <button
                            onClick={() => setBrandPriceSort('none')}
                            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                              brandPriceSort === 'none'
                                ? 'bg-charcoal text-white'
                                : 'bg-white text-charcoal hover:bg-gray-100'
                            }`}
                          >
                            Domyślnie
                          </button>
                          <button
                            onClick={() => setBrandPriceSort('asc')}
                            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors border-l border-light-grey ${
                              brandPriceSort === 'asc'
                                ? 'bg-charcoal text-white'
                                : 'bg-white text-charcoal hover:bg-gray-100'
                            }`}
                          >
                            Rosnąco
                          </button>
                          <button
                            onClick={() => setBrandPriceSort('desc')}
                            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors border-l border-light-grey ${
                              brandPriceSort === 'desc'
                                ? 'bg-charcoal text-white'
                                : 'bg-white text-charcoal hover:bg-gray-100'
                            }`}
                          >
                            Malejąco
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {loading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-charcoal"></div>
                    </div>
                  ) : (
                    <ProductGrid
                      products={getVisibleProducts()}
                      onProductClick={handleProductClick}
                      categoryTitle={getCategoryTitle()}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </main>

        <Footer />

        <BottomNav
          currentView={currentView}
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          onChangeView={handleViewChange}
        />
    </div>
  );
}

export default App;
