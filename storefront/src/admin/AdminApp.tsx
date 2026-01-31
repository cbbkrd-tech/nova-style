import { useState, useEffect } from 'react';
import { supabase } from '../lib/medusa';
import type { Tables } from '../types/database';

/**
 * Resize image before upload to reduce file size and improve thumbnail quality
 * Max dimension 1400px - good balance between quality and performance
 */
async function resizeImage(file: File, maxDimension: number = 1400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Only resize if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Use high-quality image smoothing
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }

      // Convert to blob with good quality JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.9 // 90% quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

type Product = Tables<'products'>;
type ProductVariant = Tables<'product_variants'>;

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_main: boolean;
  sort_order: number;
}

interface ProductWithVariants extends Product {
  product_variants: ProductVariant[];
  product_images?: ProductImage[];
}

type AdminView = 'products' | 'orders';

interface Order {
  id: number;
  session_id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_street: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_method: string;
  items: any[];
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  status: string;
  created_at: string;
  inpost_shipment_id: number | null;
  inpost_tracking_number: string | null;
  inpost_status: string | null;
}

export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<AdminView>(() => {
    const saved = localStorage.getItem('admin_view');
    return (saved === 'orders' || saved === 'products') ? saved : 'products';
  });
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddAIForm, setShowAddAIForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'women' | 'men'>('all');

  // Persist view to localStorage
  useEffect(() => {
    localStorage.setItem('admin_view', currentView);
  }, [currentView]);

  // Check auth on mount
  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      setIsAuthenticated(true);
      fetchProducts();
      fetchOrders();
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    // Simple admin login - in production use Supabase Auth
    if (email === 'admin123' && password === 'admin123') {
      localStorage.setItem('admin_session', 'true');
      setIsAuthenticated(true);
      fetchProducts();
    } else {
      alert('Nieprawidłowe dane logowania');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsAuthenticated(false);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_images(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data as ProductWithVariants[]);
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders((data as unknown) as Order[]);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId as unknown as string);

    if (error) {
      throw new Error('Nie udało się usunąć zamówienia');
    }

    // Update local state
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const handleUpdateStock = async (variantId: string, newStock: number) => {
    // Update local state immediately (optimistic update)
    setProducts(prev => prev.map(product => ({
      ...product,
      product_variants: product.product_variants.map(v =>
        v.id === variantId ? { ...v, stock: newStock } : v
      )
    })));

    // Save to database in background
    const { error } = await supabase
      .from('product_variants')
      .update({ stock: newStock })
      .eq('id', variantId);

    if (error) {
      alert('Błąd przy aktualizacji stanu magazynowego');
      fetchProducts(); // Revert on error
    }
  };

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !isActive })
      .eq('id', productId);

    if (error) {
      alert('Błąd przy aktualizacji produktu: ' + error.message);
    } else {
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      alert('Błąd przy usuwaniu produktu');
    } else {
      fetchProducts();
    }
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#37393D] text-white">
      <header className="bg-[#26272B] p-4 flex justify-between items-center border-b border-gray-700">
        <h1 className="text-xl tracking-[0.1em]" style={{ fontFamily: "'Playfair Display', serif" }}>NOVA STYLE <span className="text-gray-400 text-sm font-normal">Admin</span></h1>
        <div className="flex items-center gap-4">
          {/* Main navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('products')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                currentView === 'products' ? 'bg-white text-black' : 'bg-transparent border border-gray-500 hover:border-white text-gray-300'
              }`}
            >
              Produkty
            </button>
            <button
              onClick={() => setCurrentView('orders')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                currentView === 'orders' ? 'bg-white text-black' : 'bg-transparent border border-gray-500 hover:border-white text-gray-300'
              }`}
            >
              Zamówienia ({orders.filter(o => o.status === 'paid' || o.status === 'verified').length})
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-500 hover:border-white hover:text-white text-gray-300 text-sm transition-colors"
          >
            Wyloguj
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {currentView === 'products' ? (
          <>
            {/* Header with add buttons */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium tracking-wide">Produkty</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddAIForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 text-sm font-medium transition-all flex items-center gap-2"
                >
                  <span>✨</span> Dodaj produkt (AI)
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-white text-black hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  + Dodaj produkt
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  categoryFilter === 'all' ? 'bg-white text-black' : 'bg-[#26272B] hover:bg-gray-600 text-gray-300'
                }`}
              >
                Wszystkie ({products.length})
              </button>
              <button
                onClick={() => setCategoryFilter('women')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  categoryFilter === 'women' ? 'bg-white text-black' : 'bg-[#26272B] hover:bg-gray-600 text-gray-300'
                }`}
              >
                Kobiety ({products.filter(p => p.category === 'women').length})
              </button>
              <button
                onClick={() => setCategoryFilter('men')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  categoryFilter === 'men' ? 'bg-white text-black' : 'bg-[#26272B] hover:bg-gray-600 text-gray-300'
                }`}
              >
                Mężczyźni ({products.filter(p => p.category === 'men').length})
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10">Ładowanie...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {products
                  .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
                  .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDeleteProduct}
                    onUpdateStock={handleUpdateStock}
                    onEdit={() => setEditingProduct(product)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <OrdersView orders={orders} onRefresh={fetchOrders} onDeleteOrder={handleDeleteOrder} />
        )}

        {showAddForm && (
          <AddProductForm
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              fetchProducts();
            }}
          />
        )}

        {editingProduct && (
          <EditProductForm
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onSuccess={() => {
              setEditingProduct(null);
              fetchProducts();
            }}
          />
        )}

        {showAddAIForm && (
          <AddProductAIForm
            onClose={() => setShowAddAIForm(false)}
            onSuccess={() => {
              setShowAddAIForm(false);
              fetchProducts();
            }}
          />
        )}
      </main>
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-[#37393D] flex items-center justify-center">
      <div className="bg-[#26272B] p-8 w-full max-w-md border border-gray-700">
        <h1 className="text-2xl text-white mb-2 text-center tracking-[0.1em]" style={{ fontFamily: "'Playfair Display', serif" }}>NOVA STYLE</h1>
        <p className="text-gray-400 text-sm text-center mb-8 tracking-widest">ADMIN PANEL</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(email, password);
          }}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Login"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
          />
          <button
            type="submit"
            className="w-full p-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors tracking-widest text-sm"
          >
            ZALOGUJ
          </button>
        </form>
        <p className="text-gray-500 text-xs mt-6 text-center">
          Demo: admin123 / admin123
        </p>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onToggleActive,
  onDelete,
  onUpdateStock,
  onEdit,
}: {
  product: ProductWithVariants;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onUpdateStock: (variantId: string, stock: number) => void;
  onEdit: () => void;
}) {
  const [showStock, setShowStock] = useState(false);

  return (
    <div className="bg-[#26272B] overflow-hidden border border-gray-700">
      {/* Image */}
      <div className="relative">
        <img
          src={product.image_url || '/images/products/placeholder.png'}
          alt={product.name}
          className="w-full h-32 object-cover"
        />
        <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium ${
          product.is_active ? 'bg-white text-black' : 'bg-gray-600 text-white'
        }`}>
          {product.is_active ? 'Aktywny' : 'Ukryty'}
        </div>
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-medium">
          {product.category === 'women' ? 'K' : 'M'}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{product.name}</h3>
        <p className="text-gray-400 text-xs">{product.color}</p>
        <p className="text-white font-medium text-sm mt-1">
          {(product.price / 100).toFixed(0)} PLN
        </p>

        {/* Actions */}
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => onToggleActive(product.id, product.is_active || false)}
            className="flex-1 px-2 py-1.5 bg-[#37393D] hover:bg-gray-600 text-xs border border-gray-600"
          >
            {product.is_active ? 'Ukryj' : 'Pokaż'}
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-2 py-1.5 bg-white text-black hover:bg-gray-200 text-xs"
          >
            Edytuj
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="px-2 py-1.5 bg-[#37393D] hover:bg-gray-500 text-xs border border-gray-600"
          >
            ×
          </button>
        </div>

        {/* Stock toggle */}
        <button
          onClick={() => setShowStock(!showStock)}
          className="w-full mt-2 py-1.5 bg-[#37393D] hover:bg-gray-600 text-xs border border-gray-600"
        >
          {showStock ? 'Schowaj magazyn ▲' : 'Magazyn ▼'}
        </button>

        {/* Stock by size */}
        {showStock && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <p className="text-[10px] text-gray-500 mb-1">-1 = ukryty, 0 = niedostępny</p>
            <div className="grid grid-cols-6 gap-1">
              {sortBySize(product.product_variants || []).map((variant) => (
                <StockInput
                  key={variant.id}
                  variant={variant}
                  onUpdateStock={onUpdateStock}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

function sortBySize(variants: ProductVariant[]) {
  return [...variants].sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));
}

// Stock input with local state - saves only on blur
function StockInput({
  variant,
  onUpdateStock,
}: {
  variant: ProductVariant;
  onUpdateStock: (variantId: string, stock: number) => void;
}) {
  const [localValue, setLocalValue] = useState((variant.stock ?? 0).toString());

  const handleBlur = () => {
    const newStock = parseInt(localValue, 10);
    if (!isNaN(newStock) && newStock !== (variant.stock ?? 0)) {
      onUpdateStock(variant.id, newStock);
    }
  };

  return (
    <div className="text-center">
      <span className="text-[10px] text-gray-400 block">{variant.size}</span>
      <input
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className="w-full p-1 bg-[#37393D] border border-gray-600 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

interface ImageItem {
  file: File;
  preview: string;
  isMain: boolean;
}

function AddProductForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<'women' | 'men'>('women');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [subcategories, setSubcategories] = useState<{ id: string; name: string }[]>([]);
  const [brandId, setBrandId] = useState('');
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [sizeGuide, setSizeGuide] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({
    'XS': -1, 'S': -1, 'M': -1, 'L': -1, 'XL': -1, 'XXL': -1, 'One Size': -1
  });

  // Fetch brands on mount
  useEffect(() => {
    async function fetchBrands() {
      const { data } = await (supabase as any)
        .from('brands')
        .select('id, name')
        .order('sort_order');
      setBrands(data || []);
    }
    fetchBrands();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    async function fetchSubcategories() {
      const { data } = await supabase
        .from('subcategories')
        .select('id, name')
        .eq('parent_category', category)
        .order('sort_order');
      setSubcategories(data || []);
      setSubcategoryId(''); // Reset on category change
    }
    fetchSubcategories();
  }, [category]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: ImageItem[] = Array.from(files).map((file, idx) => ({
        file,
        preview: URL.createObjectURL(file),
        isMain: images.length === 0 && idx === 0, // First image is main by default
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleSetMain = (index: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isMain: i === index })));
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the main image, set first as main
      if (prev[index].isMain && updated.length > 0) {
        updated[0].isMain = true;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subcategoryId) {
      alert('Wybierz podkategorię produktu');
      return;
    }

    setLoading(true);

    // Upload all images (resized for better performance)
    const uploadedImages: { url: string; isMain: boolean }[] = [];
    for (const img of images) {
      // Resize image before upload - max 1400px, converted to JPEG
      const resizedBlob = await resizeImage(img.file);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, resizedBlob, { contentType: 'image/jpeg' });

      if (uploadError) {
        alert('Błąd przy uploadzie zdjęcia: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
      uploadedImages.push({ url: urlData.publicUrl, isMain: img.isMain });
    }

    const mainImage = uploadedImages.find(img => img.isMain)?.url || uploadedImages[0]?.url || null;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        price: Math.round(parseFloat(price) * 100),
        category,
        subcategory_id: subcategoryId,
        brand_id: brandId || null,
        color,
        description: description || null,
        size_guide: sizeGuide || null,
        image_url: mainImage,
        is_active: true,
        show_on_homepage: showOnHomepage,
      })
      .select()
      .single();

    if (error) {
      alert('Błąd przy dodawaniu produktu: ' + error.message);
      setLoading(false);
      return;
    }

    // Save images to product_images table
    if (uploadedImages.length > 0) {
      const imageRecords = uploadedImages.map((img, idx) => ({
        product_id: product.id,
        image_url: img.url,
        is_main: img.isMain,
        sort_order: idx,
      }));
      await supabase.from('product_images').insert(imageRecords);
    }

    // Add all sizes with user-specified stock (use -1 stock to hide, 0 for out of stock)
    const variants = SIZE_ORDER.map((size) => ({
      product_id: product.id,
      size,
      stock: stockBySize[size] ?? -1,
    }));

    await supabase.from('product_variants').insert(variants);

    setLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#26272B] p-6 border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-medium mb-4 tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>Dodaj produkt</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nazwa produktu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
            required
          />
          <input
            type="number"
            placeholder="Cena (PLN)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
            step="0.01"
            required
          />

          {/* Category selection */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Kategoria produktu:</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="women"
                  checked={category === 'women'}
                  onChange={() => setCategory('women')}
                  className="w-4 h-4 accent-white"
                />
                <span>Kobiety</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="men"
                  checked={category === 'men'}
                  onChange={() => setCategory('men')}
                  className="w-4 h-4 accent-white"
                />
                <span>Mężczyźni</span>
              </label>
            </div>
          </div>

          {/* Subcategory selection */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Podkategoria: <span className="text-red-400">*</span></p>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
              required
            >
              <option value="">-- Wybierz podkategorię --</option>
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand selection */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Marka:</p>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
            >
              <option value="">-- Bez marki --</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Show on homepage */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnHomepage}
                onChange={(e) => setShowOnHomepage(e.target.checked)}
                className="w-5 h-5 accent-white"
              />
              <div>
                <span className="font-medium">Pokaż na stronie głównej</span>
                <p className="text-sm text-gray-400">Produkt będzie widoczny na głównej stronie sklepu</p>
              </div>
            </label>
          </div>

          <input
            type="text"
            placeholder="Kolor"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
            required
          />

          {/* Description */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Opis produktu:</p>
            <textarea
              placeholder="Elegancka bluza wykonana z wysokiej jakości bawełny..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 bg-[#26272B] border border-gray-600 text-white focus:border-white outline-none transition-colors resize-none"
            />
          </div>

          {/* Size Guide */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Tabela rozmiarów:</p>
            <textarea
              placeholder={"XS: klatka 82-86, talia 62-66\nS: klatka 86-90, talia 66-70\nM: klatka 90-94, talia 70-74\nModel: 175cm, rozmiar M"}
              value={sizeGuide}
              onChange={(e) => setSizeGuide(e.target.value)}
              rows={4}
              className="w-full p-3 bg-[#26272B] border border-gray-600 text-white focus:border-white outline-none transition-colors resize-none"
            />
          </div>

          {/* Stock by size */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">📏 Stany magazynowe (-1 = ukryty, 0 = niedostępny):</p>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(stockBySize).map(([size, stock]) => (
                <div key={size} className="text-center">
                  <span className="text-[10px] text-gray-400 block mb-1">{size}</span>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStockBySize(prev => ({
                      ...prev,
                      [size]: parseInt(e.target.value) || 0
                    }))}
                    className="w-full p-1 bg-[#26272B] border border-gray-600 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Multi-image upload */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Zdjęcia produktu (kliknij aby wybrać główne):</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:border file:border-gray-600 file:bg-[#26272B] file:text-white hover:file:bg-gray-600 file:cursor-pointer"
            />
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Preview ${idx + 1}`}
                      onClick={() => handleSetMain(idx)}
                      className={`w-20 h-20 object-cover cursor-pointer transition-all ${
                        img.isMain ? 'ring-2 ring-white ring-offset-2 ring-offset-[#37393D]' : 'hover:opacity-80'
                      }`}
                    />
                    {img.isMain && (
                      <span className="absolute -top-1 -left-1 bg-white text-black text-[10px] px-1 font-medium">
                        Główne
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 hover:bg-gray-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Dodaj przynajmniej jedno zdjęcie</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 bg-[#37393D] border border-gray-600 hover:border-white transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 p-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors"
            >
              {loading ? 'Dodawanie...' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ExistingImage {
  id: string;
  url: string;
  isMain: boolean;
}

interface NewImage {
  file: File;
  preview: string;
  isMain: boolean;
}

function EditProductForm({
  product,
  onClose,
  onSuccess,
}: {
  product: ProductWithVariants;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState((product.price / 100).toString());
  const [category, setCategory] = useState<'women' | 'men'>(product.category);
  const [subcategoryId, setSubcategoryId] = useState((product as any).subcategory_id || '');
  const [subcategories, setSubcategories] = useState<{ id: string; name: string }[]>([]);
  const [brandId, setBrandId] = useState((product as any).brand_id || '');
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [color, setColor] = useState(product.color);
  const [description, setDescription] = useState(product.description || '');
  const [sizeGuide, setSizeGuide] = useState((product as any).size_guide || '');
  const [showOnHomepage, setShowOnHomepage] = useState((product as any).show_on_homepage ?? true);
  const [loading, setLoading] = useState(false);

  // Fetch brands on mount
  useEffect(() => {
    async function fetchBrands() {
      const { data } = await (supabase as any)
        .from('brands')
        .select('id, name')
        .order('sort_order');
      setBrands(data || []);
    }
    fetchBrands();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    async function fetchSubcategories() {
      const { data } = await supabase
        .from('subcategories')
        .select('id, name')
        .eq('parent_category', category)
        .order('sort_order');
      setSubcategories(data || []);
      // Only reset if category actually changed from original
      if (category !== product.category) {
        setSubcategoryId('');
      }
    }
    fetchSubcategories();
  }, [category, product.category]);

  // Multi-image state
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(() => {
    const images = product.product_images || [];
    if (images.length > 0) {
      return images.map(img => ({ id: img.id, url: img.image_url, isMain: img.is_main }));
    }
    // Fallback to main image_url if no product_images
    if (product.image_url) {
      return [{ id: 'legacy', url: product.image_url, isMain: true }];
    }
    return [];
  });
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const hasMain = existingImages.some(img => img.isMain) || newImages.some(img => img.isMain);
      const newImgs: NewImage[] = Array.from(files).map((file, idx) => ({
        file,
        preview: URL.createObjectURL(file),
        isMain: !hasMain && existingImages.length === 0 && newImages.length === 0 && idx === 0,
      }));
      setNewImages(prev => [...prev, ...newImgs]);
    }
  };

  const handleSetMainExisting = (index: number) => {
    setExistingImages(prev => prev.map((img, i) => ({ ...img, isMain: i === index })));
    setNewImages(prev => prev.map(img => ({ ...img, isMain: false })));
  };

  const handleSetMainNew = (index: number) => {
    setExistingImages(prev => prev.map(img => ({ ...img, isMain: false })));
    setNewImages(prev => prev.map((img, i) => ({ ...img, isMain: i === index })));
  };

  const handleRemoveExisting = (index: number) => {
    const img = existingImages[index];
    if (img.id !== 'legacy') {
      setImagesToDelete(prev => [...prev, img.id]);
    }
    setExistingImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index].isMain && updated.length > 0) {
        updated[0].isMain = true;
      } else if (prev[index].isMain && newImages.length > 0) {
        setNewImages(curr => curr.map((img, i) => ({ ...img, isMain: i === 0 })));
      }
      return updated;
    });
  };

  const handleRemoveNew = (index: number) => {
    setNewImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index].isMain && updated.length > 0) {
        updated[0].isMain = true;
      } else if (prev[index].isMain && existingImages.length > 0) {
        setExistingImages(curr => curr.map((img, i) => ({ ...img, isMain: i === 0 })));
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subcategoryId) {
      alert('Wybierz podkategorię produktu');
      return;
    }

    setLoading(true);

    // Upload new images (resized for better performance)
    const uploadedImages: { url: string; isMain: boolean }[] = [];
    for (const img of newImages) {
      // Resize image before upload - max 1400px, converted to JPEG
      const resizedBlob = await resizeImage(img.file);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, resizedBlob, { contentType: 'image/jpeg' });

      if (uploadError) {
        alert('Błąd przy uploadzie zdjęcia: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
      uploadedImages.push({ url: urlData.publicUrl, isMain: img.isMain });
    }

    // Delete removed images
    for (const imgId of imagesToDelete) {
      await supabase.from('product_images').delete().eq('id', imgId);
    }

    // Update existing images (is_main status)
    for (const img of existingImages) {
      if (img.id !== 'legacy') {
        await supabase.from('product_images').update({ is_main: img.isMain }).eq('id', img.id);
      }
    }

    // Insert new images
    if (uploadedImages.length > 0) {
      const maxSort = existingImages.length;
      const imageRecords = uploadedImages.map((img, idx) => ({
        product_id: product.id,
        image_url: img.url,
        is_main: img.isMain,
        sort_order: maxSort + idx,
      }));
      await supabase.from('product_images').insert(imageRecords);
    }

    // Determine main image URL
    const mainExisting = existingImages.find(img => img.isMain);
    const mainNew = uploadedImages.find(img => img.isMain);
    const mainImageUrl = mainNew?.url || mainExisting?.url || existingImages[0]?.url || uploadedImages[0]?.url || product.image_url;

    const { error } = await supabase
      .from('products')
      .update({
        name,
        price: Math.round(parseFloat(price) * 100),
        category,
        subcategory_id: subcategoryId,
        brand_id: brandId || null,
        color,
        description: description || null,
        size_guide: sizeGuide || null,
        image_url: mainImageUrl,
        show_on_homepage: showOnHomepage,
      })
      .eq('id', product.id);

    if (error) {
      alert('Błąd przy aktualizacji produktu: ' + error.message);
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#26272B] p-6 border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-medium mb-4 tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>Edytuj produkt</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nazwa produktu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
            required
          />
          <input
            type="number"
            placeholder="Cena (PLN)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
            step="0.01"
            required
          />

          {/* Category selection */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Kategoria produktu:</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-category"
                  value="women"
                  checked={category === 'women'}
                  onChange={() => setCategory('women')}
                  className="w-4 h-4 accent-white"
                />
                <span>Kobiety</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-category"
                  value="men"
                  checked={category === 'men'}
                  onChange={() => setCategory('men')}
                  className="w-4 h-4 accent-white"
                />
                <span>Mężczyźni</span>
              </label>
            </div>
          </div>

          {/* Subcategory selection */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Podkategoria: <span className="text-red-400">*</span></p>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
              required
            >
              <option value="">-- Wybierz podkategorię --</option>
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand selection */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Marka:</p>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
            >
              <option value="">-- Bez marki --</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Show on homepage */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnHomepage}
                onChange={(e) => setShowOnHomepage(e.target.checked)}
                className="w-5 h-5 accent-white"
              />
              <div>
                <span className="font-medium">Pokaż na stronie głównej</span>
                <p className="text-sm text-gray-400">Produkt będzie widoczny na głównej stronie sklepu</p>
              </div>
            </label>
          </div>

          <input
            type="text"
            placeholder="Kolor"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full p-3 bg-[#37393D] border border-gray-600 text-white focus:border-white outline-none transition-colors"
            required
          />

          {/* Description */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Opis produktu:</p>
            <textarea
              placeholder="Elegancka bluza wykonana z wysokiej jakości bawełny..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 bg-[#26272B] border border-gray-600 text-white focus:border-white outline-none transition-colors resize-none"
            />
          </div>

          {/* Size Guide */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Tabela rozmiarów:</p>
            <textarea
              placeholder={"XS: klatka 82-86, talia 62-66\nS: klatka 86-90, talia 66-70\nM: klatka 90-94, talia 70-74\nModel: 175cm, rozmiar M"}
              value={sizeGuide}
              onChange={(e) => setSizeGuide(e.target.value)}
              rows={4}
              className="w-full p-3 bg-[#26272B] border border-gray-600 text-white focus:border-white outline-none transition-colors resize-none"
            />
          </div>

          {/* Multi-image upload */}
          <div className="bg-[#37393D] p-4 border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Zdjęcia produktu (kliknij aby wybrać główne):</p>

            {/* Existing images */}
            {(existingImages.length > 0 || newImages.length > 0) && (
              <div className="mb-3 flex flex-wrap gap-2">
                {existingImages.map((img, idx) => (
                  <div key={`existing-${idx}`} className="relative group">
                    <img
                      src={img.url}
                      alt={`Existing ${idx + 1}`}
                      onClick={() => handleSetMainExisting(idx)}
                      className={`w-20 h-20 object-cover cursor-pointer transition-all ${
                        img.isMain ? 'ring-2 ring-white ring-offset-2 ring-offset-[#37393D]' : 'hover:opacity-80'
                      }`}
                    />
                    {img.isMain && (
                      <span className="absolute -top-1 -left-1 bg-white text-black text-[10px] px-1 font-medium">
                        Główne
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 hover:bg-gray-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {newImages.map((img, idx) => (
                  <div key={`new-${idx}`} className="relative group">
                    <img
                      src={img.preview}
                      alt={`New ${idx + 1}`}
                      onClick={() => handleSetMainNew(idx)}
                      className={`w-20 h-20 object-cover cursor-pointer transition-all ${
                        img.isMain ? 'ring-2 ring-white ring-offset-2 ring-offset-[#37393D]' : 'hover:opacity-80'
                      }`}
                    />
                    {img.isMain && (
                      <span className="absolute -top-1 -left-1 bg-white text-black text-[10px] px-1 font-medium">
                        Główne
                      </span>
                    )}
                    <span className="absolute -bottom-1 -left-1 bg-gray-500 text-[10px] px-1 text-white">
                      Nowe
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNew(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 hover:bg-gray-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:border file:border-gray-600 file:bg-[#26272B] file:text-white hover:file:bg-gray-600 file:cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 bg-[#37393D] border border-gray-600 hover:border-white transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 p-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors"
            >
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Orders View Component
function OrdersView({ orders, onRefresh, onDeleteOrder }: { orders: Order[]; onRefresh: () => void; onDeleteOrder: (orderId: number) => Promise<void> }) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'shipped'>('paid');
  const [creatingShipment, setCreatingShipment] = useState<number | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('small');
  const [shipmentStatus, setShipmentStatus] = useState<{ orderId: number; message: string; type: 'success' | 'error' } | null>(null);

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'all') return true;
    // Include both 'paid' and 'verified' status (verified = after P24 verification)
    if (statusFilter === 'paid') return (o.status === 'paid' || o.status === 'verified') && !o.inpost_shipment_id;
    if (statusFilter === 'shipped') return o.inpost_shipment_id !== null;
    return true;
  });

  const downloadLabel = async (shipmentId: number): Promise<boolean> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/inpost-get-label?shipmentId=${shipmentId}&format=pdf`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        return false;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etykieta-${shipmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    } catch {
      return false;
    }
  };

  const handleCreateShipmentAndDownload = async (orderId: number) => {
    setCreatingShipment(orderId);
    setShipmentStatus(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Step 1: Create shipment
      const response = await fetch(`${supabaseUrl}/functions/v1/inpost-create-shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          orderId,
          parcelSize: selectedSize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd przy tworzeniu przesyłki');
      }

      // Step 2: Download label automatically
      const shipmentId = data.shipmentId;
      let labelDownloaded = false;

      if (shipmentId) {
        // Try to download label (might need a short delay for InPost to process)
        await new Promise(resolve => setTimeout(resolve, 1000));
        labelDownloaded = await downloadLabel(shipmentId);
      }

      setShipmentStatus({
        orderId,
        message: labelDownloaded
          ? `Przesyłka utworzona! Tracking: ${data.trackingNumber || '(w przygotowaniu)'}`
          : `Przesyłka utworzona (ID: ${shipmentId}). Etykieta dostępna po odświeżeniu.`,
        type: 'success'
      });

      // Wait a bit for database to update, then refresh and switch to shipped tab
      await new Promise(resolve => setTimeout(resolve, 500));
      await onRefresh();
      setStatusFilter('shipped');

      // Auto-hide success message after 5 seconds
      setTimeout(() => setShipmentStatus(null), 5000);

    } catch (err) {
      console.error('Create shipment error:', err);
      setShipmentStatus({
        orderId,
        message: err instanceof Error ? err.message : 'Nieznany błąd',
        type: 'error'
      });
    } finally {
      setCreatingShipment(null);
    }
  };

  const handleDownloadLabel = async (shipmentId: number) => {
    const success = await downloadLabel(shipmentId);
    if (!success) {
      alert('Nie można pobrać etykiety - spróbuj ponownie za chwilę');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć to zamówienie? Ta operacja jest nieodwracalna.')) return;

    setDeletingOrder(orderId);
    try {
      await onDeleteOrder(orderId);
    } catch (err) {
      alert('Błąd przy usuwaniu zamówienia: ' + (err instanceof Error ? err.message : 'Nieznany błąd'));
    } finally {
      setDeletingOrder(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (order: Order) => {
    if (order.inpost_shipment_id) {
      return <span className="px-2 py-1 bg-green-600 text-white text-xs">Wysłane</span>;
    }
    if (order.status === 'paid' || order.status === 'verified') {
      return <span className="px-2 py-1 bg-yellow-600 text-white text-xs">Opłacone</span>;
    }
    if (order.status === 'pending') {
      return <span className="px-2 py-1 bg-gray-600 text-white text-xs">Oczekuje</span>;
    }
    return <span className="px-2 py-1 bg-red-600 text-white text-xs">{order.status}</span>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium tracking-wide">Zamówienia</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-[#26272B] hover:bg-gray-600 text-sm border border-gray-600 transition-colors"
        >
          Odśwież
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setStatusFilter('paid')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'paid' ? 'bg-white text-black' : 'bg-[#26272B] hover:bg-gray-600 text-gray-300'
          }`}
        >
          Do wysłania ({orders.filter(o => (o.status === 'paid' || o.status === 'verified') && !o.inpost_shipment_id).length})
        </button>
        <button
          onClick={() => setStatusFilter('shipped')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'shipped' ? 'bg-white text-black' : 'bg-[#26272B] hover:bg-gray-600 text-gray-300'
          }`}
        >
          Wysłane ({orders.filter(o => o.inpost_shipment_id !== null).length})
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'all' ? 'bg-white text-black' : 'bg-[#26272B] hover:bg-gray-600 text-gray-300'
          }`}
        >
          Wszystkie ({orders.length})
        </button>
      </div>

      {/* Parcel size selector */}
      {statusFilter === 'paid' && (
        <div className="mb-4 flex items-center gap-4 p-4 bg-[#26272B] border border-gray-700">
          <span className="text-sm text-gray-300">Rozmiar paczki dla nowych przesyłek:</span>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value as 'small' | 'medium' | 'large')}
            className="px-3 py-2 bg-[#37393D] border border-gray-600 text-white text-sm"
          >
            <option value="small">A (mały) - 8×38×64 cm</option>
            <option value="medium">B (średni) - 19×38×64 cm</option>
            <option value="large">C (duży) - 41×38×64 cm</option>
          </select>
        </div>
      )}

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Brak zamówień w tej kategorii</div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-[#26272B] border border-gray-700 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">#{order.id}</span>
                    {getStatusBadge(order)}
                  </div>
                  <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{(order.total_amount / 100).toFixed(2)} PLN</p>
                  <p className="text-sm text-gray-400">{order.shipping_method}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Klient</p>
                  <p className="text-sm">{order.customer_name}</p>
                  <p className="text-sm text-gray-400">{order.customer_email}</p>
                  {order.customer_phone && <p className="text-sm text-gray-400">{order.customer_phone}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Adres dostawy</p>
                  <p className="text-sm">{order.shipping_street}</p>
                  <p className="text-sm text-gray-400">{order.shipping_postal_code} {order.shipping_city}</p>
                </div>
              </div>

              {/* Items */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Produkty ({order.items?.length || 0})</p>
                <div className="flex flex-wrap gap-2">
                  {order.items?.map((item: any, idx: number) => (
                    <span key={idx} className="text-xs bg-[#37393D] px-2 py-1">
                      {item.name} ({item.selectedSize}) x{item.quantity}
                    </span>
                  ))}
                </div>
              </div>

              {/* InPost info */}
              {order.inpost_shipment_id && (
                <div className="mb-3 p-3 bg-[#37393D] border border-gray-600">
                  <p className="text-xs text-gray-500 mb-1">Przesyłka InPost</p>
                  <p className="text-sm">
                    <span className="text-gray-400">ID:</span> {order.inpost_shipment_id}
                  </p>
                  {order.inpost_tracking_number && (
                    <p className="text-sm">
                      <span className="text-gray-400">Tracking:</span>{' '}
                      <a
                        href={`https://inpost.pl/sledzenie-przesylek?number=${order.inpost_tracking_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {order.inpost_tracking_number}
                      </a>
                    </p>
                  )}
                  {order.inpost_status && (
                    <p className="text-sm">
                      <span className="text-gray-400">Status:</span> {order.inpost_status}
                    </p>
                  )}
                </div>
              )}

              {/* Status message */}
              {shipmentStatus && shipmentStatus.orderId === order.id && (
                <div className={`mb-3 p-3 text-sm ${
                  shipmentStatus.type === 'success' ? 'bg-green-900/50 border border-green-600' : 'bg-red-900/50 border border-red-600'
                }`}>
                  {shipmentStatus.message}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {(order.status === 'paid' || order.status === 'verified') && !order.inpost_shipment_id && (order.shipping_method === 'paczkomat' || order.shipping_method === 'courier') && (
                  <button
                    onClick={() => handleCreateShipmentAndDownload(order.id)}
                    disabled={creatingShipment === order.id}
                    className="px-4 py-2 bg-yellow-500 text-black hover:bg-yellow-400 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {creatingShipment === order.id ? 'Tworzenie przesyłki...' : 'Utwórz przesyłkę i pobierz etykietę'}
                  </button>
                )}
                {order.inpost_shipment_id && (
                  <button
                    onClick={() => handleDownloadLabel(order.inpost_shipment_id!)}
                    className="px-4 py-2 bg-[#37393D] hover:bg-gray-600 text-sm border border-gray-600 transition-colors"
                  >
                    Pobierz etykietę
                  </button>
                )}
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  disabled={deletingOrder === order.id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm transition-colors disabled:opacity-50"
                >
                  {deletingOrder === order.id ? 'Usuwanie...' : 'Usuń'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Default reference images URLs
const DEFAULT_REFERENCE_IMAGES = {
  full_body: 'https://iwrjwqdtjvdqqbxrdspu.supabase.co/storage/v1/object/public/products/ai-reference-full-body.jpg',
  close_up: 'https://iwrjwqdtjvdqqbxrdspu.supabase.co/storage/v1/object/public/products/ai-reference-close-up.jpg',
  ghost: 'https://iwrjwqdtjvdqqbxrdspu.supabase.co/storage/v1/object/public/products/ai-reference-ghost.jpg',
};

interface AIGeneratedImage {
  type: 'full_body' | 'close_up' | 'ghost';
  data: string; // base64 - current version
  versions: string[]; // all versions (base64), index 0 = original
  currentVersion: number; // index of current version
  isMain: boolean;
}

interface ReferenceImage {
  type: 'full_body' | 'close_up' | 'ghost';
  url: string;
  file?: File;
}

function AddProductAIForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Step tracking
  const [currentStep, setCurrentStep] = useState<'upload' | 'generating' | 'review'>('upload');

  // Input images
  const [productImage, setProductImage] = useState<{ file: File; preview: string } | null>(null);
  const [compositionImage, setCompositionImage] = useState<{ file: File; preview: string } | null>(null);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([
    { type: 'full_body', url: DEFAULT_REFERENCE_IMAGES.full_body },
    { type: 'close_up', url: DEFAULT_REFERENCE_IMAGES.close_up },
    { type: 'ghost', url: DEFAULT_REFERENCE_IMAGES.ghost },
  ]);

  // Generated content
  const [generatedImages, setGeneratedImages] = useState<AIGeneratedImage[]>([]);
  const [_compositionText, setCompositionText] = useState(''); // Stored for potential display
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productColor, setProductColor] = useState('');

  // Form fields
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<'women' | 'men'>('women');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [subcategories, setSubcategories] = useState<{ id: string; name: string }[]>([]);
  const [brandId, setBrandId] = useState('');
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [sizeGuide, setSizeGuide] = useState('');
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({
    'XS': -1, 'S': -1, 'M': -1, 'L': -1, 'XL': -1, 'XXL': -1, 'One Size': -1
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [editingImage, setEditingImage] = useState<'full_body' | 'close_up' | 'ghost' | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [regeneratingImage, setRegeneratingImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [viewingGeneratedImage, setViewingGeneratedImage] = useState<string | null>(null); // base64 for lightbox

  // Fetch brands and subcategories
  useEffect(() => {
    async function fetchBrands() {
      const { data } = await (supabase as any).from('brands').select('id, name').order('sort_order');
      setBrands(data || []);
    }
    fetchBrands();
  }, []);

  useEffect(() => {
    async function fetchSubcategories() {
      const { data } = await supabase
        .from('subcategories')
        .select('id, name')
        .eq('parent_category', category)
        .order('sort_order');
      setSubcategories(data || []);
      setSubcategoryId('');
    }
    fetchSubcategories();
  }, [category]);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Convert URL to base64
  const urlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Handle product image upload
  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage({ file, preview: URL.createObjectURL(file) });
    }
  };

  // Handle composition image upload
  const handleCompositionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompositionImage({ file, preview: URL.createObjectURL(file) });
    }
  };

  // Handle reference image change
  const handleReferenceImageChange = (type: 'full_body' | 'close_up' | 'ghost', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImages(prev => prev.map(img =>
        img.type === type ? { ...img, url: URL.createObjectURL(file), file } : img
      ));
    }
  };

  // Reset reference image to default
  const resetReferenceImage = (type: 'full_body' | 'close_up' | 'ghost') => {
    setReferenceImages(prev => prev.map(img =>
      img.type === type ? { type, url: DEFAULT_REFERENCE_IMAGES[type] } : img
    ));
  };

  // Call AI API
  const callAI = async (action: string, body: any) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ action, ...body }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI API error');
    }

    return response.json();
  };

  // Generate all content
  const handleGenerate = async () => {
    if (!productImage || !compositionImage) {
      setError('Wgraj zdjęcie produktu i składu');
      return;
    }

    setLoading(true);
    setError('');
    setCurrentStep('generating');

    try {
      // Convert images to base64
      const productBase64 = await fileToBase64(productImage.file);
      const compositionBase64 = await fileToBase64(compositionImage.file);

      // Prepare reference images
      const refImagesBase64: { type: string; data: string }[] = [];
      for (const ref of referenceImages) {
        const data = ref.file
          ? await fileToBase64(ref.file)
          : await urlToBase64(ref.url);
        refImagesBase64.push({ type: ref.type, data });
      }

      // Step 1: Analyze composition
      setLoadingMessage('Analizuję skład produktu...');
      const compResult = await callAI('analyze_composition', {
        compositionImage: compositionBase64,
      });
      setCompositionText(compResult.compositionText || '');

      // Step 2: Generate images
      setLoadingMessage('Generuję zdjęcia produktu (to może potrwać kilka minut)...');
      const imgResult = await callAI('generate_images', {
        productImage: productBase64,
        referenceImages: refImagesBase64,
      });

      const generated = (imgResult.generatedImages || []).map((img: any, idx: number) => ({
        ...img,
        versions: [img.data], // Original is version 0
        currentVersion: 0,
        isMain: idx === 0, // First image is main by default
      }));
      setGeneratedImages(generated);

      // Step 3: Generate text
      setLoadingMessage('Generuję nazwę i opis...');
      const textResult = await callAI('generate_text', {
        productImage: productBase64,
        compositionText: compResult.compositionText || '',
      });

      setProductName(textResult.name || '');
      setProductDescription(textResult.description || '');
      setProductColor(textResult.color || '');

      setCurrentStep('review');
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Błąd generowania');
      setCurrentStep('upload');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Regenerate single image
  const handleRegenerateImage = async (imageType: 'full_body' | 'close_up' | 'ghost') => {
    if (!productImage || !editPrompt.trim()) return;

    setRegeneratingImage(imageType);
    setError('');

    try {
      const productBase64 = await fileToBase64(productImage.file);

      const refImage = referenceImages.find(r => r.type === imageType);
      const refBase64 = refImage?.file
        ? await fileToBase64(refImage.file)
        : refImage?.url
          ? await urlToBase64(refImage.url)
          : null;

      if (!refBase64) {
        throw new Error('Brak zdjęcia referencyjnego');
      }

      // Get current version of the image being edited
      const currentImg = generatedImages.find(img => img.type === imageType);
      const currentImageData = currentImg?.data;

      const result = await callAI('regenerate_image', {
        productImage: productBase64,
        referenceImages: [{ type: imageType, data: refBase64 }],
        imageType,
        editPrompt: editPrompt.trim(),
        currentGeneratedImage: currentImageData, // Send current version for editing
      });

      if (result.generatedImages?.[0]) {
        const newData = result.generatedImages[0].data;
        setGeneratedImages(prev => prev.map(img =>
          img.type === imageType
            ? {
                ...img,
                data: newData,
                versions: [...img.versions, newData],
                currentVersion: img.versions.length, // New version index
              }
            : img
        ));
      }

      setEditingImage(null);
      setEditPrompt('');
    } catch (err) {
      console.error('Regeneration error:', err);
      setError(err instanceof Error ? err.message : 'Błąd regenerowania');
    } finally {
      setRegeneratingImage(null);
    }
  };

  // Set main image
  const setMainImage = (type: 'full_body' | 'close_up' | 'ghost') => {
    setGeneratedImages(prev => prev.map(img => ({
      ...img,
      isMain: img.type === type,
    })));
  };

  // Change image version
  const setImageVersion = (type: 'full_body' | 'close_up' | 'ghost', versionIndex: number) => {
    setGeneratedImages(prev => prev.map(img =>
      img.type === type
        ? { ...img, data: img.versions[versionIndex], currentVersion: versionIndex }
        : img
    ));
  };

  // Submit product
  const handleSubmit = async () => {
    if (!subcategoryId) {
      setError('Wybierz podkategorię produktu');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError('Podaj cenę produktu');
      return;
    }

    if (generatedImages.length === 0) {
      setError('Brak wygenerowanych zdjęć');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload generated images to Supabase storage
      const uploadedImages: { url: string; isMain: boolean }[] = [];

      for (const img of generatedImages) {
        // Convert base64 to blob
        const byteCharacters = atob(img.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${img.type}.png`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, blob, { contentType: 'image/png' });

        if (uploadError) {
          throw new Error(`Błąd uploadu: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
        uploadedImages.push({ url: urlData.publicUrl, isMain: img.isMain });
      }

      const mainImageUrl = uploadedImages.find(i => i.isMain)?.url || uploadedImages[0]?.url;
      const slug = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: productName,
          slug,
          price: Math.round(parseFloat(price) * 100),
          category,
          subcategory_id: subcategoryId,
          brand_id: brandId || null,
          color: productColor,
          description: productDescription,
          size_guide: sizeGuide || null,
          image_url: mainImageUrl,
          is_active: true,
          show_on_homepage: showOnHomepage,
        })
        .select()
        .single();

      if (productError) {
        throw new Error(`Błąd tworzenia produktu: ${productError.message}`);
      }

      // Add images to product_images
      const imageRecords = uploadedImages.map((img, idx) => ({
        product_id: product.id,
        image_url: img.url,
        is_main: img.isMain,
        sort_order: idx,
      }));
      await supabase.from('product_images').insert(imageRecords);

      // Add variants with stock
      const variants = Object.entries(stockBySize)
        .filter(([_, stock]) => stock >= -1) // Include all, even hidden (-1)
        .map(([size, stock]) => ({
          product_id: product.id,
          size,
          stock,
        }));

      await supabase.from('product_variants').insert(variants);

      onSuccess();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Błąd dodawania produktu');
    } finally {
      setLoading(false);
    }
  };

  const imageTypeLabels: Record<string, string> = {
    full_body: 'Full Body',
    close_up: 'Close-up',
    ghost: 'Ghost',
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#26272B] border border-gray-700 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#26272B] border-b border-gray-700 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-medium tracking-wide flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            <span>✨</span> Dodaj produkt z AI
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="p-6">
          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-600 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="mb-6 p-6 bg-[#37393D] border border-gray-600 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-300">{loadingMessage || 'Przetwarzanie...'}</p>
            </div>
          )}

          {/* Step 1: Upload */}
          {currentStep === 'upload' && !loading && (
            <div className="space-y-6">
              {/* Source images */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">📸 Krok 1: Wgraj zdjęcia źródłowe</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Product image */}
                  <div className="bg-[#37393D] p-4 border border-gray-600">
                    <p className="text-sm text-gray-400 mb-2">Zdjęcie produktu</p>
                    {productImage ? (
                      <div className="relative">
                        <img src={productImage.preview} alt="Product" className="w-full h-40 object-cover" />
                        <button
                          onClick={() => setProductImage(null)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white text-xs rounded-full"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="block w-full h-40 border-2 border-dashed border-gray-500 hover:border-white cursor-pointer flex items-center justify-center transition-colors">
                        <span className="text-gray-400">+ Wgraj zdjęcie</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleProductImageChange} />
                      </label>
                    )}
                  </div>

                  {/* Composition image */}
                  <div className="bg-[#37393D] p-4 border border-gray-600">
                    <p className="text-sm text-gray-400 mb-2">Zdjęcie składu (metka)</p>
                    {compositionImage ? (
                      <div className="relative">
                        <img src={compositionImage.preview} alt="Composition" className="w-full h-40 object-cover" />
                        <button
                          onClick={() => setCompositionImage(null)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white text-xs rounded-full"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="block w-full h-40 border-2 border-dashed border-gray-500 hover:border-white cursor-pointer flex items-center justify-center transition-colors">
                        <span className="text-gray-400">+ Wgraj zdjęcie</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleCompositionImageChange} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Reference images */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">📷 Krok 2: Zdjęcia referencyjne (modelka)</h3>
                <p className="text-xs text-gray-500 mb-3">Domyślnie wgrane. Możesz zmienić jeśli chcesz użyć innej modelki.</p>
                <div className="grid grid-cols-3 gap-4">
                  {referenceImages.map((ref) => (
                    <div key={ref.type} className="bg-[#37393D] p-3 border border-gray-600">
                      <p className="text-xs text-gray-400 mb-2 text-center">{imageTypeLabels[ref.type]}</p>
                      <img src={ref.url} alt={ref.type} className="w-full h-32 object-cover mb-2" />
                      <div className="flex gap-1">
                        <label className="flex-1 px-2 py-1 bg-[#26272B] text-center text-xs cursor-pointer hover:bg-gray-600 transition-colors">
                          Zmień
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleReferenceImageChange(ref.type, e)}
                          />
                        </label>
                        {ref.file && (
                          <button
                            onClick={() => resetReferenceImage(ref.type)}
                            className="px-2 py-1 bg-[#26272B] text-xs hover:bg-gray-600 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!productImage || !compositionImage}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
              >
                🚀 Generuj zdjęcia i opis
              </button>
            </div>
          )}

          {/* Step 2: Review and edit */}
          {currentStep === 'review' && !loading && (
            <div className="space-y-6">
              {/* Generated images */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">🖼️ Wygenerowane zdjęcia (kliknij aby powiększyć)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {generatedImages.map((img) => (
                    <div
                      key={img.type}
                      className={`bg-[#37393D] p-3 border-2 transition-all ${
                        img.isMain ? 'border-yellow-500' : 'border-gray-600'
                      }`}
                    >
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-400">
                            {imageTypeLabels[img.type]}
                          </p>
                          {/* Version selector - only show if more than 1 version */}
                          {img.versions.length > 1 && (
                            <select
                              value={img.currentVersion}
                              onChange={(e) => setImageVersion(img.type, parseInt(e.target.value))}
                              className="text-xs bg-[#26272B] border border-gray-600 text-gray-300 px-2 py-1 cursor-pointer"
                            >
                              {img.versions.map((_, idx) => (
                                <option key={idx} value={idx}>
                                  Wersja {idx + 1}{idx === 0 ? ' (oryginał)' : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        {regeneratingImage === img.type ? (
                          <div className="w-full h-40 flex items-center justify-center bg-[#26272B]">
                            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                          </div>
                        ) : (
                          <img
                            src={`data:image/png;base64,${img.data}`}
                            alt={img.type}
                            className="w-full h-40 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setViewingGeneratedImage(img.data)}
                          />
                        )}
                      </div>
                      {/* Checkbox for main image */}
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={img.isMain}
                          onChange={() => setMainImage(img.type)}
                          className="w-4 h-4 accent-yellow-500"
                        />
                        <span className="text-xs text-gray-300">Główne zdjęcie</span>
                      </label>
                      <button
                        onClick={() => {
                          setEditingImage(img.type);
                          setEditPrompt('');
                        }}
                        className="w-full mt-2 py-1 bg-[#26272B] text-xs hover:bg-gray-600 transition-colors"
                      >
                        ✏️ Edytuj
                      </button>
                    </div>
                  ))}
                </div>

                {/* Edit prompt */}
                {editingImage && (
                  <div className="mt-4 p-4 bg-[#37393D] border border-gray-600">
                    <p className="text-sm text-gray-300 mb-2">
                      Edycja: <strong>{imageTypeLabels[editingImage]}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mb-2">Opisz co zmienić (np. "rękawy powinny mieć krótszą koronkę")</p>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="Wpisz instrukcje dla AI..."
                      rows={2}
                      className="w-full p-2 bg-[#26272B] border border-gray-600 text-white text-sm resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleRegenerateImage(editingImage)}
                        disabled={!editPrompt.trim() || regeneratingImage !== null}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm disabled:opacity-50"
                      >
                        Regeneruj
                      </button>
                      <button
                        onClick={() => { setEditingImage(null); setEditPrompt(''); }}
                        className="px-4 py-2 bg-[#26272B] text-gray-300 text-sm hover:bg-gray-600"
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Product details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">📝 Dane produktu</h3>

                {/* Name */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Nazwa produktu</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full p-3 bg-[#37393D] border border-gray-600 text-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Opis produktu</label>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={5}
                    className="w-full p-3 bg-[#37393D] border border-gray-600 text-white resize-none"
                  />
                </div>

                {/* Price and Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Cena (PLN)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="np. 119"
                      className="w-full p-3 bg-[#37393D] border border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Kolor</label>
                    <input
                      type="text"
                      value={productColor}
                      onChange={(e) => setProductColor(e.target.value)}
                      className="w-full p-3 bg-[#37393D] border border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="bg-[#37393D] p-4 border border-gray-600">
                  <p className="text-xs text-gray-400 mb-2">Kategoria</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={category === 'women'}
                        onChange={() => setCategory('women')}
                        className="accent-white"
                      />
                      <span>Kobiety</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={category === 'men'}
                        onChange={() => setCategory('men')}
                        className="accent-white"
                      />
                      <span>Mężczyźni</span>
                    </label>
                  </div>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Podkategoria <span className="text-red-400">*</span></label>
                  <select
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="w-full p-3 bg-[#37393D] border border-gray-600 text-white"
                  >
                    <option value="">-- Wybierz --</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Marka</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full p-3 bg-[#37393D] border border-gray-600 text-white"
                  >
                    <option value="">-- Bez marki --</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                {/* Show on homepage */}
                <label className="flex items-center gap-3 cursor-pointer bg-[#37393D] p-4 border border-gray-600">
                  <input
                    type="checkbox"
                    checked={showOnHomepage}
                    onChange={(e) => setShowOnHomepage(e.target.checked)}
                    className="w-5 h-5 accent-white"
                  />
                  <div>
                    <span className="font-medium">Pokaż na stronie głównej</span>
                    <p className="text-sm text-gray-400">Produkt będzie widoczny na głównej stronie</p>
                  </div>
                </label>

                {/* Stock by size */}
                <div className="bg-[#37393D] p-4 border border-gray-600">
                  <p className="text-xs text-gray-400 mb-2">📏 Stany magazynowe (-1 = ukryty, 0 = niedostępny)</p>
                  <div className="grid grid-cols-7 gap-2">
                    {Object.entries(stockBySize).map(([size, stock]) => (
                      <div key={size} className="text-center">
                        <span className="text-xs text-gray-400 block mb-1">{size}</span>
                        <input
                          type="number"
                          value={stock}
                          onChange={(e) => setStockBySize(prev => ({
                            ...prev,
                            [size]: parseInt(e.target.value) || 0
                          }))}
                          className="w-full p-2 bg-[#26272B] border border-gray-600 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size guide */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Tabela rozmiarów (opcjonalne)</label>
                  <textarea
                    value={sizeGuide}
                    onChange={(e) => setSizeGuide(e.target.value)}
                    placeholder="ONE SIZE - uniwersalny rozmiar..."
                    rows={3}
                    className="w-full p-3 bg-[#37393D] border border-gray-600 text-white resize-none"
                  />
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="flex-1 py-3 bg-[#37393D] border border-gray-600 hover:border-white transition-colors"
                >
                  ← Wróć
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  ✅ Dodaj produkt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox for generated images */}
      {viewingGeneratedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] cursor-pointer"
          onClick={() => setViewingGeneratedImage(null)}
        >
          <img
            src={`data:image/png;base64,${viewingGeneratedImage}`}
            alt="Powiększone zdjęcie"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setViewingGeneratedImage(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
