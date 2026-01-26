import React, { useState } from 'react';
import { CartItem } from '../types/types';

type ShippingMethod = 'paczkomat' | 'pickup';
// Future: | 'courier'

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
  // Courier fields (for future use)
  street: string;
  city: string;
  postalCode: string;
}

const SHIPPING_OPTIONS = {
  paczkomat: { label: 'Paczkomat InPost', price: 18, description: 'Dostawa w 1-2 dni robocze' },
  pickup: { label: 'Odbiór osobisty', price: 0, description: 'Nowa Sól - darmowy odbiór' },
  // Future shipping options:
  // courier: { label: 'Kurier InPost', price: 22, description: 'Dostawa pod drzwi w 1-2 dni robocze' },
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
    street: '',
    city: '',
    postalCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingCost = SHIPPING_OPTIONS[shippingMethod].price;
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
    // Paczkomat validation
    if (shippingMethod === 'paczkomat') {
      if (!formData.paczkomatCode || formData.paczkomatCode.length < 3) {
        setError('Wprowadź numer paczkomatu');
        return false;
      }
    }
    // Future: Courier address validation
    // if (shippingMethod === 'courier') {
    //   if (!formData.street) { setError('Wprowadź adres dostawy'); return false; }
    //   if (!formData.city) { setError('Wprowadź miasto'); return false; }
    //   if (!formData.postalCode || !/^\d{2}-\d{3}$/.test(formData.postalCode)) {
    //     setError('Wprowadź poprawny kod pocztowy (XX-XXX)'); return false;
    //   }
    // }
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
          phone: formData.phone || undefined,
          street: shippingMethod === 'paczkomat'
            ? `Paczkomat: ${formData.paczkomatCode}`
            : shippingMethod === 'pickup'
              ? 'Odbiór osobisty - Nowa Sól'
              : formData.street,
          city: shippingMethod === 'pickup' ? 'Nowa Sól' : (formData.city || '-'),
          postalCode: shippingMethod === 'pickup' ? '67-100' : (formData.postalCode || '-'),
          shippingMethod: shippingMethod,
          paczkomatCode: shippingMethod === 'paczkomat' ? formData.paczkomatCode : undefined,
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
              Telefon (opcjonalnie)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
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
            {(Object.entries(SHIPPING_OPTIONS) as [ShippingMethod, typeof SHIPPING_OPTIONS.paczkomat][]).map(([key, option]) => (
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
                  {option.price === 0 ? 'Gratis' : `${option.price} PLN`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Paczkomat number field */}
        {shippingMethod === 'paczkomat' && (
          <div className="space-y-4 pt-4 border-t border-light-grey">
            <h3 className="text-sm font-medium text-charcoal uppercase tracking-wider">
              Paczkomat
            </h3>

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
          </div>
        )}

        {/* Future: Courier address fields */}
        {/* shippingMethod === 'courier' && (
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
        ) */}

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
    </div>
  );
};

export default CheckoutForm;
