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
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-black p-4 flex justify-between items-center">
        <h1 className="text-2xl font-black">NOVA-STYLE Admin</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
        >
          Wyloguj
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Header with add button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Produkty</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            + Dodaj produkt
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              categoryFilter === 'all' ? 'bg-white text-black' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Wszystkie ({products.length})
          </button>
          <button
            onClick={() => setCategoryFilter('women')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              categoryFilter === 'women' ? 'bg-pink-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Kobiety ({products.filter(p => p.category === 'women').length})
          </button>
          <button
            onClick={() => setCategoryFilter('men')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              categoryFilter === 'men' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-black text-white mb-6 text-center">NOVA-STYLE Admin</h1>
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
            className="w-full p-3 bg-gray-700 rounded text-white"
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded text-white"
          />
          <button
            type="submit"
            className="w-full p-3 bg-white text-black font-bold rounded hover:bg-gray-200"
          >
            Zaloguj
          </button>
        </form>
        <p className="text-gray-500 text-sm mt-4 text-center">
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
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Image */}
      <div className="relative">
        <img
          src={product.image_url || '/images/products/placeholder.png'}
          alt={product.name}
          className="w-full h-32 object-cover"
        />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
          product.is_active ? 'bg-green-600' : 'bg-gray-600'
        }`}>
          {product.is_active ? 'Aktywny' : 'Ukryty'}
        </div>
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold ${
          product.category === 'women' ? 'bg-pink-600' : 'bg-blue-600'
        }`}>
          {product.category === 'women' ? 'K' : 'M'}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-sm truncate">{product.name}</h3>
        <p className="text-gray-400 text-xs">{product.color}</p>
        <p className="text-green-400 font-bold text-sm mt-1">
          {(product.price / 100).toFixed(0)} PLN
        </p>

        {/* Actions */}
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => onToggleActive(product.id, product.is_active || false)}
            className="flex-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs"
          >
            {product.is_active ? 'Ukryj' : 'Pokaż'}
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs"
          >
            Edytuj
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="px-2 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs"
          >
            X
          </button>
        </div>

        {/* Stock toggle */}
        <button
          onClick={() => setShowStock(!showStock)}
          className="w-full mt-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs"
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
        className="w-full p-1 bg-gray-700 rounded text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
  const [color, setColor] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [loading, setLoading] = useState(false);

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
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Dodaj produkt</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nazwa produktu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded"
            required
          />
          <input
            type="number"
            placeholder="Cena (PLN)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded"
            step="0.01"
            required
          />

          {/* Category selection */}
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-sm text-gray-300 mb-2">Kategoria produktu:</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="women"
                  checked={category === 'women'}
                  onChange={() => setCategory('women')}
                  className="w-4 h-4"
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
                  className="w-4 h-4"
                />
                <span>Mężczyźni</span>
              </label>
            </div>
          </div>

          {/* Show on homepage */}
          <div className="bg-gray-700 p-4 rounded">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnHomepage}
                onChange={(e) => setShowOnHomepage(e.target.checked)}
                className="w-5 h-5"
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
            className="w-full p-3 bg-gray-700 rounded"
            required
          />

          {/* Multi-image upload */}
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-sm text-gray-300 mb-2">Zdjęcia produktu (kliknij aby wybrać główne):</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-600 file:text-white hover:file:bg-gray-500"
            />
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Preview ${idx + 1}`}
                      onClick={() => handleSetMain(idx)}
                      className={`w-20 h-20 object-cover rounded cursor-pointer transition-all ${
                        img.isMain ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-gray-700' : 'hover:opacity-80'
                      }`}
                    />
                    {img.isMain && (
                      <span className="absolute -top-1 -left-1 bg-green-500 text-[10px] px-1 rounded text-white">
                        Główne
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
              className="flex-1 p-3 bg-gray-600 rounded"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 p-3 bg-green-600 rounded font-bold"
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
  const [color, setColor] = useState(product.color);
  const [showOnHomepage, setShowOnHomepage] = useState((product as any).show_on_homepage ?? true);
  const [loading, setLoading] = useState(false);

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
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edytuj produkt</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nazwa produktu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded"
            required
          />
          <input
            type="number"
            placeholder="Cena (PLN)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded"
            step="0.01"
            required
          />

          {/* Category selection */}
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-sm text-gray-300 mb-2">Kategoria produktu:</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-category"
                  value="women"
                  checked={category === 'women'}
                  onChange={() => setCategory('women')}
                  className="w-4 h-4"
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
                  className="w-4 h-4"
                />
                <span>Mężczyźni</span>
              </label>
            </div>
          </div>

          {/* Show on homepage */}
          <div className="bg-gray-700 p-4 rounded">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnHomepage}
                onChange={(e) => setShowOnHomepage(e.target.checked)}
                className="w-5 h-5"
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
            className="w-full p-3 bg-gray-700 rounded"
            required
          />

          {/* Multi-image upload */}
          <div className="bg-gray-700 p-4 rounded">
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
                      className={`w-20 h-20 object-cover rounded cursor-pointer transition-all ${
                        img.isMain ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-gray-700' : 'hover:opacity-80'
                      }`}
                    />
                    {img.isMain && (
                      <span className="absolute -top-1 -left-1 bg-green-500 text-[10px] px-1 rounded text-white">
                        Główne
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
                      className={`w-20 h-20 object-cover rounded cursor-pointer transition-all ${
                        img.isMain ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-gray-700' : 'hover:opacity-80'
                      }`}
                    />
                    {img.isMain && (
                      <span className="absolute -top-1 -left-1 bg-green-500 text-[10px] px-1 rounded text-white">
                        Główne
                      </span>
                    )}
                    <span className="absolute -bottom-1 -left-1 bg-blue-500 text-[10px] px-1 rounded text-white">
                      Nowe
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNew(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-600 file:text-white hover:file:bg-gray-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 bg-gray-600 rounded"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 p-3 bg-blue-600 rounded font-bold"
            >
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
