import React from 'react';

interface HeroProps {
  onCategoryClick: (category: 'men' | 'women') => void;
}

const Hero: React.FC<HeroProps> = ({ onCategoryClick }) => {
  return (
    <div className="w-[90%] md:w-[75%] py-6 mx-auto">
      <div className="grid grid-cols-2 gap-4 h-[500px] md:h-[75vh]">
        
        {/* Women Card */}
        <div 
          onClick={() => onCategoryClick('women')}
          className="group relative overflow-hidden rounded-xl cursor-pointer"
        >
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 z-10"></div>
          <img 
            src="/images/hero/hero-women.png"
            alt="Kobiety" 
            className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <h2 className="text-2xl md:text-5xl text-white tracking-[0.1em] drop-shadow-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              KOBIETY
            </h2>
          </div>
        </div>

        {/* Men Card */}
        <div 
          onClick={() => onCategoryClick('men')}
          className="group relative overflow-hidden rounded-xl cursor-pointer"
        >
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 z-10"></div>
          <img 
            src="/images/hero/hero-men.png"
            alt="Mężczyźni" 
            className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <h2 className="text-2xl md:text-5xl text-white tracking-[0.1em] drop-shadow-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              MĘŻCZYŹNI
            </h2>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Hero;