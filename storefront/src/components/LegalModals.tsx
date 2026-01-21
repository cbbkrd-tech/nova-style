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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCloseRegulamin}>
          <div className="bg-white max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-serif text-charcoal">Regulamin sklepu</h2>
              <button onClick={onCloseRegulamin} className="text-charcoal/60 hover:text-charcoal text-2xl leading-none">&times;</button>
            </div>
            <div className="text-charcoal/80 text-sm space-y-4">
              <h3 className="text-charcoal font-bold">1. Postanowienia ogólne</h3>
              <p>Sklep internetowy NOVA STYLE prowadzony jest przez Nova Style Karolina Syczewska z siedzibą: ul. Konstruktorów 6c lok. 16, 67-100 Nowa Sól. Kontakt: novastylebutik@gmail.com.</p>

              <h3 className="text-charcoal font-bold">2. Dane sprzedawcy</h3>
              <p>Nova Style Karolina Syczewska<br/>ul. Konstruktorów 6c lok. 16<br/>67-100 Nowa Sól<br/>NIP: 9252151803<br/>REGON: 543111905<br/>E-mail: novastylebutik@gmail.com</p>

              <h3 className="text-charcoal font-bold">3. Zwrot towaru</h3>
              <p>Zwroty należy wysyłać na adres: Nova Style Karolina Syczewska, ul. Konstruktorów 6c lok. 16, 67-100 Nowa Sól. Konsument ma prawo odstąpić od umowy w terminie 14 dni bez podania przyczyny.</p>

              <h3 className="text-charcoal font-bold">4. Składanie zamówień</h3>
              <p>Zamówienia można składać przez stronę internetową 24/7. Potwierdzenie przyjęcia zamówienia zostanie wysłane na podany adres e-mail.</p>

              <h3 className="text-charcoal font-bold">5. Ceny i płatności</h3>
              <p>Ceny są cenami brutto (zawierają VAT) w złotych polskich. Akceptujemy: karty płatnicze, przelewy, BLIK oraz inne metody Przelewy24. Płatność w ciągu 3 dni od złożenia zamówienia.</p>

              <h3 className="text-charcoal font-bold">6. Dostawa</h3>
              <p>Wysyłka w ciągu 1-3 dni roboczych od zaksięgowania płatności. Koszt dostawy podany przy finalizacji zamówienia.</p>

              <h3 className="text-charcoal font-bold">7. Reklamacje</h3>
              <p>Reklamację można złożyć na adres novastylebutik@gmail.com lub pisemnie na adres siedziby. Reklamacje rozpatrywane są w ciągu 14 dni.</p>

              <h3 className="text-charcoal font-bold">8. Ochrona danych</h3>
              <p>Dane osobowe przetwarzane są zgodnie z RODO. Szczegóły w Polityce Prywatności.</p>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClosePrivacy}>
          <div className="bg-white max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-serif text-charcoal">Polityka prywatności</h2>
              <button onClick={onClosePrivacy} className="text-charcoal/60 hover:text-charcoal text-2xl leading-none">&times;</button>
            </div>
            <div className="text-charcoal/80 text-sm space-y-4">
              <h3 className="text-charcoal font-bold">1. Administrator danych</h3>
              <p>Administratorem danych jest Nova Style Karolina Syczewska, ul. Konstruktorów 6c lok. 16, 67-100 Nowa Sól. NIP: 9252151803, REGON: 543111905. Kontakt: novastylebutik@gmail.com.</p>

              <h3 className="text-charcoal font-bold">2. Cele przetwarzania</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Realizacja zamówień - art. 6 ust. 1 lit. b RODO</li>
                <li>Obsługa reklamacji - art. 6 ust. 1 lit. c RODO</li>
                <li>Księgowość - art. 6 ust. 1 lit. c RODO</li>
                <li>Marketing - art. 6 ust. 1 lit. f RODO</li>
              </ul>

              <h3 className="text-charcoal font-bold">3. Okres przechowywania</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Dane transakcyjne - 5 lat</li>
                <li>Dane reklamacyjne - 2 lata</li>
                <li>Dane marketingowe - do cofnięcia zgody</li>
              </ul>

              <h3 className="text-charcoal font-bold">4. Prawa użytkownika</h3>
              <p>Przysługuje Ci prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych, sprzeciwu oraz skargi do UODO.</p>

              <h3 className="text-charcoal font-bold">5. Odbiorcy danych</h3>
              <p>Dane przekazywane są: firmom kurierskim, Przelewy24, dostawcom IT, firmom księgowym. Dane nie są przekazywane poza EOG.</p>

              <h3 className="text-charcoal font-bold">6. Pliki cookies</h3>
              <p>Strona używa cookies do prawidłowego działania i analizy ruchu. Możesz zarządzać cookies w przeglądarce.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LegalModals;
