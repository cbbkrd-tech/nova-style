import React, { useState } from 'react';
import { CartItem } from '../types/types';
import { MinusIcon, PlusIcon, XIcon } from './Icons';
import LegalModals from './LegalModals';

interface CartViewProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

const CartView: React.FC<CartViewProps> = ({ items, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showRegulamin, setShowRegulamin] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = items.length > 0 ? (subtotal >= 400 ? 0 : 8) : 0;
  const total = subtotal + shipping;

  return (
    <div className="flex flex-col h-full px-4 md:px-6 pt-4 pb-32 max-w-[1400px] mx-auto animate-fade-in">
      <h2 className="text-xl md:text-3xl font-serif tracking-[0.1em] text-charcoal mb-6 text-center md:text-left">
        KOSZYK
      </h2>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-charcoal/50">
          <p className="uppercase tracking-widest text-sm">Twój koszyk jest pusty</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Cart Items */}
          <div className="space-y-4 border-b border-light-grey pb-6">
            {items.map((item) => (
              <div key={item.cartId} className="flex items-start gap-3 md:gap-4">
                {/* Product Image */}
                <div className="w-20 h-24 md:w-24 md:h-28 bg-product-bg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <h3 className="text-sm font-medium text-charcoal leading-tight mb-1 truncate">{item.name}</h3>
                      <p className="text-xs text-charcoal/60">Rozmiar: {item.selectedSize}</p>
                    </div>
                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem(item.cartId)}
                      className="text-charcoal/40 hover:text-charcoal transition-colors flex-shrink-0"
                    >
                      <XIcon />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Control */}
                    <div className="flex items-center border border-light-grey">
                      <button
                        onClick={() => onUpdateQuantity(item.cartId, -1)}
                        className="w-8 h-8 flex items-center justify-center text-charcoal/60 hover:text-charcoal transition-colors"
                      >
                        <MinusIcon />
                      </button>
                      <span className="w-8 text-center text-sm text-charcoal font-medium">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartId, 1)}
                        className="w-8 h-8 flex items-center justify-center text-charcoal/60 hover:text-charcoal transition-colors"
                      >
                        <PlusIcon />
                      </button>
                    </div>

                    <span className="text-sm font-medium text-charcoal">{item.price * item.quantity} PLN</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="py-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-charcoal/70">Suma częściowa:</span>
              <span className="text-charcoal font-medium">{subtotal} PLN</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-charcoal/70">Dostawa:</span>
              <span className="text-charcoal font-medium">{shipping} PLN</span>
            </div>
            <div className="flex justify-between text-base text-charcoal pt-2">
              <span className="font-semibold">Do zapłaty:</span>
              <span className="font-semibold">{total} PLN</span>
            </div>
          </div>

          {/* Terms acceptance checkbox */}
          <label className="flex items-start gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 border-light-grey bg-transparent accent-warm-beige cursor-pointer"
            />
            <span className="text-[11px] md:text-xs text-charcoal/60 leading-relaxed">
              Akceptuję{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowRegulamin(true); }}
                className="text-charcoal underline hover:text-charcoal/70"
              >
                Regulamin
              </button>{' '}
              oraz{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}
                className="text-charcoal underline hover:text-charcoal/70"
              >
                Politykę prywatności
              </button>
            </span>
          </label>

          {/* Checkout Button */}
          <button
            disabled={!termsAccepted}
            onClick={onCheckout}
            className={`w-full font-semibold uppercase tracking-widest text-sm py-4 transition-all btn-press ${
              termsAccepted
                ? 'bg-warm-beige text-charcoal hover:bg-warm-beige-hover cursor-pointer'
                : 'bg-light-grey text-charcoal/40 cursor-not-allowed'
            }`}
          >
            Przejdź do płatności
          </button>
        </div>
      )}

      <LegalModals
        showRegulamin={showRegulamin}
        showPrivacy={showPrivacy}
        onCloseRegulamin={() => setShowRegulamin(false)}
        onClosePrivacy={() => setShowPrivacy(false)}
      />
    </div>
  );
};

export default CartView;
