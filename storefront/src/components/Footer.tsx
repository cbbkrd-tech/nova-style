import { useState } from 'react';
import LegalModals from './LegalModals';
import { FacebookIcon, InstagramIcon } from './Icons';

const Footer = () => {
  const [showRegulamin, setShowRegulamin] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showKontakt, setShowKontakt] = useState(false);

  return (
    <>
      <footer className="bg-off-white border-t border-light-grey py-12 mt-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start">

            {/* Links Section */}
            <div className="flex flex-wrap gap-4 md:gap-8 mb-8 md:mb-0">
              <button onClick={() => setShowKontakt(true)} className="text-charcoal/60 hover:text-charcoal text-sm transition-colors">Kontakt</button>
              <button onClick={() => setShowRegulamin(true)} className="text-charcoal/60 hover:text-charcoal text-sm transition-colors">Regulamin</button>
              <button onClick={() => setShowPrivacy(true)} className="text-charcoal/60 hover:text-charcoal text-sm transition-colors">Polityka prywatności</button>
            </div>

            {/* Social Icons */}
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/NovaStyleButik" target="_blank" rel="noopener noreferrer" className="text-charcoal/60 hover:text-charcoal transition-colors">
                <FacebookIcon />
              </a>
              <a href="https://www.instagram.com/novastylebutik/" target="_blank" rel="noopener noreferrer" className="text-charcoal/60 hover:text-charcoal transition-colors">
                <InstagramIcon />
              </a>
            </div>
          </div>

          <div className="mt-8 text-xs text-charcoal/40">
             &copy; 2026 NOVA STYLE. All rights reserved.
          </div>
        </div>
      </footer>

      <LegalModals
        showRegulamin={showRegulamin}
        showPrivacy={showPrivacy}
        onCloseRegulamin={() => setShowRegulamin(false)}
        onClosePrivacy={() => setShowPrivacy(false)}
      />

      {/* Kontakt Modal */}
      {showKontakt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowKontakt(false)}>
          <div className="bg-white border border-light-grey max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif text-charcoal">Kontakt</h2>
              <button onClick={() => setShowKontakt(false)} className="text-charcoal/40 hover:text-charcoal text-2xl">&times;</button>
            </div>
            <div className="text-charcoal/70 space-y-4">
              <div>
                <p className="text-charcoal font-semibold mb-1">Dane firmy</p>
                <p>Nova Style Karolina Syczewska</p>
                <p>ul. Konstruktorów 6c lok. 16</p>
                <p>67-100 Nowa Sól</p>
                <p className="mt-2">NIP: 9252151803</p>
                <p>REGON: 543111905</p>
              </div>
              <div>
                <p className="text-charcoal font-semibold mb-1">E-mail</p>
                <p>novastylebutik@gmail.com</p>
              </div>
              <div>
                <p className="text-charcoal font-semibold mb-1">Telefon</p>
                <p>608 846 414</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
