import { useState, useEffect } from 'react';
import { supabase } from '../lib/medusa';
import type { Tables } from '../types/database';

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

export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'women' | 'men'>('all');

  // Check auth on mount
  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      setIsAuthenticated(true);
      fetchProducts();
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
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-gray-500 hover:border-white hover:text-white text-gray-300 text-sm transition-colors"
        >
          Wyloguj
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Header with add button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium tracking-wide">Produkty</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-white text-black hover:bg-gray-200 text-sm font-medium transition-colors"
          >
            + Dodaj produkt
          </button>
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

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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
  const [color, setColor] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [loading, setLoading] = useState(false);

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

    // Upload all images
    const uploadedImages: { url: string; isMain: boolean }[] = [];
    for (const img of images) {
      const fileExt = img.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, img.file);

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
        color,
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

    // Add all sizes (use -1 stock to hide, 0 for out of stock)
    const variants = SIZE_ORDER.map((size) => ({
      product_id: product.id,
      size,
      stock: 10,
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
  const [color, setColor] = useState(product.color);
  const [showOnHomepage, setShowOnHomepage] = useState((product as any).show_on_homepage ?? true);
  const [loading, setLoading] = useState(false);

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

    // Upload new images
    const uploadedImages: { url: string; isMain: boolean }[] = [];
    for (const img of newImages) {
      const fileExt = img.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, img.file);

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
        color,
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
