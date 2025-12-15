import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] border-t border-blk-700 py-12 mt-12">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start">
          
          {/* Links Section */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-x-12 gap-y-2 mb-8 md:mb-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm">Kobiety</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Mężczyźni</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">O nas</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Kontakt</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Pomoc</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Regulamin</a>
          </div>

          {/* Social Icons */}
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33zM9.75 15.02l5.75-3.27-5.75-3.27z"></path></svg>
            </a>
          </div>
        </div>
        
        <div className="mt-8 text-xs text-gray-600">
           &copy; 2023 BLK/OUT Streetwear. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;