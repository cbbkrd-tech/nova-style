import React, { useState, useEffect, useRef } from 'react';
import { CartItem } from '../types/types';

type ShippingMethod = 'paczkomat' | 'courier' | 'pickup';

interface CheckoutFormProps {
  items: CartItem[];
  subtotal: number;
  onBack: () => void;
  onSuccess: (sessionId: string) => void;
}

interface FormData {
  email: string;
  name: string;
  phone: string;
  paczkomatCode: string;
  paczkomatAddress: string;
  // Courier fields
  street: string;
  city: string;
  postalCode: string;
}

interface InPostPoint {
  name: string;
  address: {
    line1: string;
    line2: string;
  };
  address_details?: {
    city: string;
    post_code: string;
    street: string;
    building_number: string;
  };
}

const SHIPPING_OPTIONS = {
  paczkomat: { label: 'Paczkomat InPost', price: 18, description: 'Dostawa w 1-2 dni robocze' },
  courier: { label: 'Kurier InPost', price: 20, description: 'Dostawa pod drzwi w 1-2 dni robocze' },
  pickup: { label: 'Odbiór osobisty', price: 0, description: 'Nowa Sól - darmowy odbiór' },
};

// Geowidget token - works only on novastylebutik.pl
const GEOWIDGET_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJzQlpXVzFNZzVlQnpDYU1XU3JvTlBjRWFveFpXcW9Ua2FuZVB3X291LWxvIn0.eyJleHAiOjIwODQ5ODE1MzYsImlhdCI6MTc2OTYyMTUzNiwianRpIjoiYTk5ODNmZjItNmYyNS00NjcwLWJkODUtNGMzZWI0N2VlOTc4IiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5pbnBvc3QucGwvYXV0aC9yZWFsbXMvZXh0ZXJuYWwiLCJzdWIiOiJmOjEyNDc1MDUxLTFjMDMtNGU1OS1iYTBjLTJiNDU2OTVlZjUzNTo4SWNTRVpLQ3NpSXIwWG5RNUxtSE5DeGVOSmRPRmFTRmhkSUM5ZG8zTHBJIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoic2hpcHgiLCJzZXNzaW9uX3N0YXRlIjoiMmFjYmRjYmMtMGM0My00YjcwLThkZGYtODZjNjhiY2U4N2QyIiwic2NvcGUiOiJvcGVuaWQgYXBpOmFwaXBvaW50cyIsInNpZCI6IjJhY2JkY2JjLTBjNDMtNGI3MC04ZGRmLTg2YzY4YmNlODdkMiIsImFsbG93ZWRfcmVmZXJyZXJzIjoid3d3Lm5vdmFzdHlsZWJ1dGlrLnBsIiwidXVpZCI6ImZlZDRlNjY2LWE1MmEtNDBlNy1hMTljLWIzMWI2MjIzMzQ0MSJ9.DzM2HZnmhWG5LuBkMHthuKUmZgZcsegfcTk-Nwd727La04YQBVVq8OsU1_A_CQfTJrJRLRVmHTrbd8EQzP92sE_cgeMw7VCrAIKLoa2D9BXFmb91ki9BYD7oLsaKngOMqQxgBM5hBad5fj55jHFPpYxAkLvoPtznP7g72tZMneSGdI_zxGl0SzM7IH5KV7Ob19g0M_M2TjTHc8xAaWBVuQGeVAYIwvD3GhX6wDZfo5b8tDjiNetFzDZ5BuQ7_2ih8mlXnCcVyVSseE4GNzHLpgeCL9te2xX3u_ifKhxe5eK01T5K4MvpQN8E4cMQqELXMBo81voAH-__cfp8QEqaSA';

// Test product price in PLN (product prices in cart are in PLN)
const TEST_PRODUCT_PRICE = 1;

// Check if cart contains only test products (free shipping for testing)
const isTestOrderOnly = (items: CartItem[]): boolean => {
  return items.length > 0 && items.every(item => item.price === TEST_PRODUCT_PRICE);
};

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  items,
  subtotal,
  onBack,
  onSuccess,
}) => {
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('paczkomat');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    phone: '',
    paczkomatCode: '',
    paczkomatAddress: '',
    street: '',
    city: '',
    postalCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGeowidget, setShowGeowidget] = useState(false);
  const [isProduction, setIsProduction] = useState(false);
  const geowidgetRef = useRef<HTMLDivElement>(null);

  // Check if we're on production domain
  useEffect(() => {
    setIsProduction(window.location.hostname === 'www.novastylebutik.pl' || window.location.hostname === 'novastylebutik.pl');
  }, []);

  // Handle point selection from Geowidget
  useEffect(() => {
    const handlePointSelect = (event: CustomEvent<InPostPoint>) => {
      const point = event.detail;
      if (point) {
        setFormData(prev => ({
          ...prev,
          paczkomatCode: point.name,
          paczkomatAddress: point.address?.line1 || `${point.address_details?.street} ${point.address_details?.building_number}, ${point.address_details?.post_code} ${point.address_details?.city}` || '',
        }));
        setShowGeowidget(false);
      }
    };

    document.addEventListener('onpointselect', handlePointSelect as EventListener);
    return () => {
      document.removeEventListener('onpointselect', handlePointSelect as EventListener);
    };
  }, []);

  // Free shipping for test products only (1 PLN items)
  const isFreeShipping = isTestOrderOnly(items);
  const shippingCost = isFreeShipping ? 0 : SHIPPING_OPTIONS[shippingMethod].price;
  const total = subtotal + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Wprowadź poprawny adres email');
      return false;
    }
    if (!formData.name || formData.name.length < 3) {
      setError('Wprowadź imię i nazwisko');
      return false;
    }
    if (!formData.phone || formData.phone.length < 9) {
      setError('Wprowadź numer telefonu');
      return false;
    }
    // Paczkomat validation
    if (shippingMethod === 'paczkomat') {
      if (!formData.paczkomatCode || formData.paczkomatCode.length < 3) {
        setError('Wybierz paczkomat');
        return false;
      }
    }
    // Courier address validation
    if (shippingMethod === 'courier') {
      if (!formData.street) { setError('Wprowadź adres dostawy'); return false; }
      if (!formData.city) { setError('Wprowadź miasto'); return false; }
      if (!formData.postalCode || !/^\d{2}-\d{3}$/.test(formData.postalCode)) {
        setError('Wprowadź poprawny kod pocztowy (XX-XXX)'); return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/p24-create-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          street: shippingMethod === 'paczkomat'
            ? `Paczkomat: ${formData.paczkomatCode}`
            : shippingMethod === 'pickup'
              ? 'Odbiór osobisty - Nowa Sól'
              : formData.street,
          city: shippingMethod === 'pickup' ? 'Nowa Sól' : (formData.city || '-'),
          postalCode: shippingMethod === 'pickup' ? '67-100' : (formData.postalCode || '-'),
          shippingMethod: shippingMethod,
          paczkomatCode: shippingMethod === 'paczkomat' ? formData.paczkomatCode : undefined,
          paczkomatAddress: shippingMethod === 'paczkomat' ? formData.paczkomatAddress : undefined,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            image: item.image,
          })),
          subtotal,
          shippingCost,
          totalAmount: total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd podczas tworzenia płatności');
      }

      // Redirect to P24 payment page
      if (data.redirectUrl) {
        // Save session ID for later verification
        localStorage.setItem('nova-pending-order', data.sessionId);
        onSuccess(data.sessionId);
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('Brak adresu przekierowania do płatności');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas przetwarzania zamówienia');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-4 md:px-6 pt-4 pb-32 max-w-[800px] mx-auto animate-fade-in">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-charcoal/60 hover:text-charcoal transition-colors self-start"
      >
        &larr; Powrót do koszyka
      </button>

      <h2 className="text-xl md:text-3xl font-serif tracking-[0.1em] text-charcoal mb-6 text-center">
        DANE DO WYSYŁKI
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-charcoal uppercase tracking-wider">
            Dane kontaktowe
          </h3>

          <div>
            <label htmlFor="email" className="block text-xs text-charcoal/70 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-light-grey bg-white text-charcoal text-sm focus:outline-none focus:border-charcoal transition-colors"
              placeholder="twoj@email.pl"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-xs text-charcoal/70 mb-1">
              Imię i nazwisko *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-light-grey bg-white text-charcoal text-sm focus:outline-none focus:border-charcoal transition-colors"
              placeholder="Jan Kowalski"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs text-charcoal/70 mb-1">
              Telefon *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-light-grey bg-white text-charcoal text-sm focus:outline-none focus:border-charcoal transition-colors"
              placeholder="+48 123 456 789"
            />
          </div>
        </div>

        {/* Shipping Method */}
        <div className="space-y-4 pt-4 border-t border-light-grey">
          <h3 className="text-sm font-medium text-charcoal uppercase tracking-wider">
            Metoda dostawy
          </h3>

          <div className="space-y-2">
            {(Object.entries(SHIPPING_OPTIONS) as [ShippingMethod, typeof SHIPPING_OPTIONS.paczkomat][]).map(([key, option]) => {
              const displayPrice = isFreeShipping ? 0 : option.price;
              return (
                <label
                  key={key}
                  className={`flex items-center justify-between p-3 border cursor-pointer transition-colors ${
                    shippingMethod === key
                      ? 'border-charcoal bg-warm-beige/20'
                      : 'border-light-grey hover:border-charcoal/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={key}
                      checked={shippingMethod === key}
                      onChange={() => setShippingMethod(key)}
                      className="w-4 h-4 accent-charcoal"
                    />
                    <div>
                      <span className="text-sm font-medium text-charcoal">{option.label}</span>
                      <p className="text-xs text-charcoal/60">{option.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-charcoal">
                    {displayPrice === 0 ? 'Gratis' : `${displayPrice} PLN`}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Paczkomat selection */}
        {shippingMethod === 'paczkomat' && (
          <div className="space-y-4 pt-4 border-t border-light-grey">
            <h3 className="text-sm font-medium text-charcoal uppercase tracking-wider">
              Paczkomat
            </h3>

            {formData.paczkomatCode ? (
              <div className="p-3 bg-warm-beige/30 border border-warm-beige">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-charcoal">{formData.paczkomatCode}</p>
                    <p className="text-sm text-charcoal/70">{formData.paczkomatAddress}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => isProduction ? setShowGeowidget(true) : setFormData(prev => ({ ...prev, paczkomatCode: '', paczkomatAddress: '' }))}
                    className="text-sm text-charcoal/60 hover:text-charcoal underline"
                  >
                    Zmień
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {isProduction ? (
                  <button
                    type="button"
                    onClick={() => setShowGeowidget(true)}
                    className="w-full py-3 px-4 border-2 border-dashed border-charcoal/30 text-charcoal hover:border-charcoal hover:bg-warm-beige/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Wybierz paczkomat na mapie
                  </button>
                ) : (
                  <div>
                    <label htmlFor="paczkomatCode" className="block text-xs text-charcoal/70 mb-1">
                      Numer paczkomatu *
                    </label>
                    <input
                      type="text"
                      id="paczkomatCode"
                      name="paczkomatCode"
                      value={formData.paczkomatCode}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 border border-light-grey bg-white text-charcoal text-sm focus:outline-none focus:border-charcoal transition-colors uppercase"
                      placeholder="np. WAW123M"
                    />
                    <p className="text-xs text-charcoal/50 mt-1">
                      Znajdź swój paczkomat na <a href="https://inpost.pl/znajdz-paczkomat" target="_blank" rel="noopener noreferrer" className="underline hover:text-charcoal">inpost.pl</a>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Courier address fields */}
        {shippingMethod === 'courier' && (
          <div className="space-y-4 pt-4 border-t border-light-grey">
            <h3 className="text-sm font-medium text-charcoal uppercase tracking-wider">
              Adres dostawy
            </h3>
            <div>
              <label htmlFor="street" className="block text-xs text-charcoal/70 mb-1">Ulica i numer *</label>
              <input type="text" id="street" name="street" value={formData.street} onChange={handleChange} required
                className="w-full px-3 py-2.5 border border-light-grey bg-white text-charcoal text-sm focus:outline-none focus:border-charcoal transition-colors"
                placeholder="ul. Przykładowa 123/4" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="postalCode" className="block text-xs text-charcoal/70 mb-1">Kod pocztowy *</label>
                <input type="text" id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleChange} required maxLength={6}
                  className="w-full px-3 py-2.5 border border-light-grey bg-white text-charcoal text-sm focus:outline-none focus:border-charcoal transition-colors"
                  placeholder="00-000" />
              </div>
              <div className="col-span-2">
                <label htmlFor="city" className="block text-xs text-charcoal/70 mb-1">Miasto *</label>
                <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-light-grey bg-white text-charcoal text-sm focus:outline-none focus:border-charcoal transition-colors"
                  placeholder="Warszawa" />
              </div>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="pt-4 border-t border-light-grey space-y-2">
          <h3 className="text-sm font-medium text-charcoal uppercase tracking-wider mb-3">
            Podsumowanie
          </h3>

          <div className="flex justify-between text-sm">
            <span className="text-charcoal/70">Produkty ({items.reduce((acc, i) => acc + i.quantity, 0)} szt.):</span>
            <span className="text-charcoal">{subtotal} PLN</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/70">Dostawa:</span>
            <span className="text-charcoal">{shippingCost === 0 ? 'Gratis' : `${shippingCost} PLN`}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-light-grey">
            <span className="text-charcoal">Do zapłaty:</span>
            <span className="text-charcoal">{total} PLN</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full font-semibold uppercase tracking-widest text-sm py-4 transition-all ${
            isLoading
              ? 'bg-light-grey text-charcoal/40 cursor-wait'
              : 'bg-warm-beige text-charcoal hover:bg-warm-beige-hover cursor-pointer btn-press'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Przetwarzanie...
            </span>
          ) : (
            'Zapłać przez Przelewy24'
          )}
        </button>

        {/* P24 Logo */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-xs text-charcoal/50">Bezpieczna płatność przez</span>
          <span className="text-xs font-medium text-charcoal/70">Przelewy24</span>
        </div>
      </form>

      {/* Geowidget Modal */}
      {showGeowidget && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-light-grey">
              <h3 className="text-lg font-medium text-charcoal">Wybierz paczkomat</h3>
              <button
                onClick={() => setShowGeowidget(false)}
                className="text-charcoal/60 hover:text-charcoal text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex-1" ref={geowidgetRef}>
              {/* @ts-ignore - InPost Geowidget custom element */}
              <inpost-geowidget
                onpoint="onpointselect"
                token={GEOWIDGET_TOKEN}
                language="pl"
                config="parcelcollect"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutForm;
