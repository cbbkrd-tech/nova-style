import React from 'react';

interface LegalModalsProps {
  showRegulamin: boolean;
  showPrivacy: boolean;
  onCloseRegulamin: () => void;
  onClosePrivacy: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  showRegulamin,
  showPrivacy,
  onCloseRegulamin,
  onClosePrivacy,
}) => {
  return (
    <>
      {showRegulamin && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onCloseRegulamin}>
          <div className="bg-[#1a1a1a] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Regulamin sklepu</h2>
              <button onClick={onCloseRegulamin} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="text-gray-300 text-sm space-y-4">
              <h3 className="text-white font-bold">1. Postanowienia ogólne</h3>
              <p>Sklep internetowy NOVA STYLE prowadzony jest przez [NAZWA FIRMY] z siedzibą: [ADRES]. Kontakt: [EMAIL].</p>

              <h3 className="text-white font-bold">2. Dane sprzedawcy</h3>
              <p>[NAZWA FIRMY]<br/>[ADRES]<br/>E-mail: [EMAIL]<br/>NIP: [NIP]</p>

              <h3 className="text-white font-bold">3. Składanie zamówień</h3>
              <p>Zamówienia można składać przez stronę internetową 24/7. Potwierdzenie przyjęcia zamówienia zostanie wysłane na podany adres e-mail.</p>

              <h3 className="text-white font-bold">4. Ceny i płatności</h3>
              <p>Ceny są cenami brutto (zawierają VAT) w złotych polskich. Akceptujemy: karty płatnicze, przelewy, BLIK oraz inne metody Przelewy24. Płatność w ciągu 3 dni od złożenia zamówienia.</p>

              <h3 className="text-white font-bold">5. Dostawa</h3>
              <p>Wysyłka w ciągu 1-3 dni roboczych od zaksięgowania płatności. Koszt dostawy podany przy finalizacji zamówienia.</p>

              <h3 className="text-white font-bold">6. Prawo odstąpienia od umowy</h3>
              <p>Konsument ma prawo odstąpić od umowy w terminie 14 dni bez podania przyczyny. Aby skorzystać z tego prawa, należy poinformować Sprzedawcę drogą pisemną lub elektroniczną.</p>

              <h3 className="text-white font-bold">7. Reklamacje</h3>
              <p>Reklamację można złożyć na adres [EMAIL] lub pisemnie. Reklamacje rozpatrywane są w ciągu 14 dni.</p>

              <h3 className="text-white font-bold">8. Ochrona danych</h3>
              <p>Dane osobowe przetwarzane są zgodnie z RODO. Szczegóły w Polityce Prywatności.</p>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClosePrivacy}>
          <div className="bg-[#1a1a1a] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Polityka prywatności</h2>
              <button onClick={onClosePrivacy} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="text-gray-300 text-sm space-y-4">
              <h3 className="text-white font-bold">1. Administrator danych</h3>
              <p>Administratorem danych jest [NAZWA FIRMY], [ADRES]. Kontakt: [EMAIL].</p>

              <h3 className="text-white font-bold">2. Cele przetwarzania</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Realizacja zamówień - art. 6 ust. 1 lit. b RODO</li>
                <li>Obsługa reklamacji - art. 6 ust. 1 lit. c RODO</li>
                <li>Księgowość - art. 6 ust. 1 lit. c RODO</li>
                <li>Marketing - art. 6 ust. 1 lit. f RODO</li>
              </ul>

              <h3 className="text-white font-bold">3. Okres przechowywania</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Dane transakcyjne - 5 lat</li>
                <li>Dane reklamacyjne - 2 lata</li>
                <li>Dane marketingowe - do cofnięcia zgody</li>
              </ul>

              <h3 className="text-white font-bold">4. Prawa użytkownika</h3>
              <p>Przysługuje Ci prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych, sprzeciwu oraz skargi do UODO.</p>

              <h3 className="text-white font-bold">5. Odbiorcy danych</h3>
              <p>Dane przekazywane są: firmom kurierskim, Przelewy24, dostawcom IT, firmom księgowym. Dane nie są przekazywane poza EOG.</p>

              <h3 className="text-white font-bold">6. Pliki cookies</h3>
              <p>Strona używa cookies do prawidłowego działania i analizy ruchu. Możesz zarządzać cookies w przeglądarce.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LegalModals;
