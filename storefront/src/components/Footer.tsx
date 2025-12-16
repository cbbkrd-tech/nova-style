import { useState } from 'react';

const Footer = () => {
  const [showRegulamin, setShowRegulamin] = useState(false);
  const [showKontakt, setShowKontakt] = useState(false);

  return (
    <>
      <footer className="bg-[#26272B] border-t border-gray-700 py-12 mt-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start">

            {/* Links Section */}
            <div className="flex gap-8 mb-8 md:mb-0">
              <button onClick={() => setShowKontakt(true)} className="text-gray-400 hover:text-white text-sm">Kontakt</button>
              <button onClick={() => setShowRegulamin(true)} className="text-gray-400 hover:text-white text-sm">Regulamin</button>
            </div>

            {/* Social Icons - Facebook & Instagram only */}
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            </div>
          </div>

          <div className="mt-8 text-xs text-gray-600">
             &copy; 2026 NOVA STYLE. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Regulamin Modal */}
      {showRegulamin && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowRegulamin(false)}>
          <div className="bg-[#1a1a1a] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Regulamin sklepu</h2>
              <button onClick={() => setShowRegulamin(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="text-gray-300 text-sm space-y-4">
              <h3 className="text-white font-bold">1. Postanowienia ogólne</h3>
              <p>Sklep internetowy NOVA STYLE prowadzony jest przez NOVA STYLE Sp. z o.o. z siedzibą w Warszawie. Regulamin określa zasady korzystania ze sklepu oraz warunki sprzedaży.</p>

              <h3 className="text-white font-bold">2. Składanie zamówień</h3>
              <p>Zamówienia można składać przez stronę internetową 24/7. Potwierdzenie przyjęcia zamówienia zostanie wysłane na podany adres e-mail.</p>

              <h3 className="text-white font-bold">3. Płatności</h3>
              <p>Akceptujemy płatności kartą, przelewem bankowym oraz BLIK. Płatność należy dokonać w ciągu 3 dni od złożenia zamówienia.</p>

              <h3 className="text-white font-bold">4. Dostawa</h3>
              <p>Wysyłka realizowana jest w ciągu 1-3 dni roboczych. Koszt dostawy zależy od wybranej metody i jest podany przy finalizacji zamówienia.</p>

              <h3 className="text-white font-bold">5. Zwroty i reklamacje</h3>
              <p>Klient ma prawo zwrócić towar w ciągu 14 dni od otrzymania przesyłki bez podania przyczyny. Reklamacje rozpatrywane są w ciągu 14 dni roboczych.</p>

              <h3 className="text-white font-bold">6. Ochrona danych osobowych</h3>
              <p>Dane osobowe przetwarzane są zgodnie z RODO. Szczegółowe informacje znajdują się w Polityce Prywatności.</p>
            </div>
          </div>
        </div>
      )}

      {/* Kontakt Modal */}
      {showKontakt && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowKontakt(false)}>
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Kontakt</h2>
              <button onClick={() => setShowKontakt(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="text-gray-300 space-y-4">
              <div>
                <p className="text-white font-bold mb-1">E-mail</p>
                <p>kontakt@nova-style.pl</p>
              </div>
              <div>
                <p className="text-white font-bold mb-1">Telefon</p>
                <p>+48 123 456 789</p>
              </div>
              <div>
                <p className="text-white font-bold mb-1">Adres</p>
                <p>NOVA STYLE Sp. z o.o.</p>
                <p>ul. Modowa 15</p>
                <p>00-001 Warszawa</p>
              </div>
              <div>
                <p className="text-white font-bold mb-1">Godziny pracy</p>
                <p>Pon-Pt: 9:00 - 17:00</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;