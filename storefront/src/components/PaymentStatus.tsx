import React, { useEffect, useState } from 'react';

interface PaymentStatusProps {
  status: 'success' | 'cancelled' | 'error';
  sessionId?: string;
  onBackToShop: () => void;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ status, sessionId, onBackToShop }) => {
  const [orderCleared, setOrderCleared] = useState(false);

  useEffect(() => {
    // Clear cart if payment was successful
    if (status === 'success' && !orderCleared) {
      localStorage.removeItem('nova-cart');
      localStorage.removeItem('nova-pending-order');
      setOrderCleared(true);
    }
  }, [status, orderCleared]);

  const content = {
    success: {
      icon: (
        <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Płatność zakończona pomyślnie!',
      message: 'Dziękujemy za zakupy w Nova Style. Potwierdzenie zamówienia zostało wysłane na Twój adres email.',
      subMessage: sessionId ? `Numer zamówienia: ${sessionId.substring(0, 12)}` : undefined,
    },
    cancelled: {
      icon: (
        <svg className="w-16 h-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      title: 'Płatność anulowana',
      message: 'Twoja płatność została anulowana. Produkty nadal znajdują się w koszyku.',
      subMessage: undefined,
    },
    error: {
      icon: (
        <svg className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Błąd płatności',
      message: 'Wystąpił problem podczas przetwarzania płatności. Spróbuj ponownie lub skontaktuj się z nami.',
      subMessage: undefined,
    },
  };

  const currentContent = content[status];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 animate-fade-in">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          {currentContent.icon}
        </div>

        <h1 className="text-2xl md:text-3xl font-serif tracking-[0.1em] text-charcoal mb-4">
          {currentContent.title}
        </h1>

        <p className="text-charcoal/70 mb-2">
          {currentContent.message}
        </p>

        {currentContent.subMessage && (
          <p className="text-sm text-charcoal/50 font-mono mb-6">
            {currentContent.subMessage}
          </p>
        )}

        <div className="mt-8 space-y-3">
          <button
            onClick={onBackToShop}
            className="w-full bg-warm-beige text-charcoal font-semibold uppercase tracking-widest text-sm py-4 hover:bg-warm-beige-hover transition-all btn-press"
          >
            {status === 'success' ? 'Kontynuuj zakupy' : 'Wróć do sklepu'}
          </button>

          {status !== 'success' && (
            <button
              onClick={() => window.location.hash = 'cart'}
              className="w-full border border-charcoal text-charcoal font-semibold uppercase tracking-widest text-sm py-4 hover:bg-charcoal hover:text-white transition-all"
            >
              Wróć do koszyka
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
