import React, { useState } from 'react';
import { CartItem } from '../types/types';
import { MinusIcon, PlusIcon, XIcon } from './Icons';
import LegalModals from './LegalModals';

interface CartViewProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

const CartView: React.FC<CartViewProps> = ({ items, onUpdateQuantity, onRemoveItem }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showRegulamin, setShowRegulamin] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = items.length > 0 ? 19 : 0;
  const total = subtotal + shipping;

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-32 animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-normal tracking-[0.1em] text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
        KOSZYK
      </h2>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="uppercase tracking-widest text-sm">Twój koszyk jest pusty</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {items.map((item) => (
            <div key={item.cartId} className="flex bg-blk-800 rounded-lg p-3 relative">
              {/* Remove Button */}
              <button 
                onClick={() => onRemoveItem(item.cartId)}
                className="absolute top-3 right-3 text-gray-500 hover:text-white"
              >
                <XIcon />
              </button>

              {/* Product Image */}
              <div className="w-20 h-24 bg-blk-700 rounded overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>

              {/* Details */}
              <div className="ml-4 flex flex-col justify-between flex-grow pr-6">
                <div>
                  <h3 className="text-sm font-medium text-white uppercase tracking-wide leading-tight mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-400 font-light">Rozmiar: {item.selectedSize}, Kolor: {item.color}</p>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  {/* Quantity Control */}
                  <div className="flex items-center border border-gray-600 rounded">
                    <button 
                      onClick={() => onUpdateQuantity(item.cartId, -1)}
                      className="px-2 py-1 text-gray-400 hover:text-white"
                    >
                      <MinusIcon />
                    </button>
                    <span className="text-xs px-2 text-white font-mono">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.cartId, 1)}
                      className="px-2 py-1 text-gray-400 hover:text-white"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  
                  <span className="text-sm font-medium text-white">{item.price * item.quantity} PLN</span>
                </div>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="mt-8 pt-6 border-t border-gray-700 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-light">Suma częściowa</span>
              <span className="text-white font-medium">{subtotal} PLN</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-light">Dostawa</span>
              <span className="text-white font-medium">{shipping} PLN</span>
            </div>
            <div className="flex justify-between text-base text-white mt-4 pt-4 border-t border-gray-700">
              <span className="font-medium">Do zapłaty</span>
              <span className="font-medium">{total} PLN</span>
            </div>
          </div>

          {/* Terms acceptance checkbox */}
          <label className="flex items-start gap-3 mt-6 cursor-pointer group">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-600 bg-transparent text-white focus:ring-white focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs text-gray-400 leading-relaxed">
              Akceptuję{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowRegulamin(true); }}
                className="text-white underline hover:text-gray-300"
              >
                Regulamin
              </button>{' '}
              oraz{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}
                className="text-white underline hover:text-gray-300"
              >
                Politykę prywatności
              </button>
            </span>
          </label>

          <div className="flex justify-end mt-8">
            <button
              disabled={!termsAccepted}
              className={`w-full md:w-auto md:px-12 font-medium uppercase tracking-widest text-sm py-4 transition-colors ${
                termsAccepted
                  ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Przejdź do płatności
            </button>
          </div>
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