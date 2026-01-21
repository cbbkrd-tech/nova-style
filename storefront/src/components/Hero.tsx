import React from 'react';

interface HeroProps {
  onCategoryClick: (category: 'men' | 'women') => void;
}

const Hero: React.FC<HeroProps> = ({ onCategoryClick }) => {
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:h-[70vh]">

        {/* Women Panel */}
        <div
          onClick={() => onCategoryClick('women')}
          className="hero-panel group relative overflow-hidden cursor-pointer bg-[#E8E8E8] h-[40vh] md:h-full md:flex-1"
        >
          <img
            src="/images/hero/hero-women.webp"
            alt="Kobiety"
            className="hero-image w-full h-full object-cover object-top transition-transform duration-700"
          />
          <div className="hero-overlay absolute inset-0 bg-black/20 transition-all duration-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-white tracking-[0.2em] font-serif drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              KOBIETY
            </h2>
          </div>
        </div>

        {/* Men Panel */}
        <div
          onClick={() => onCategoryClick('men')}
          className="hero-panel group relative overflow-hidden cursor-pointer bg-[#E8E8E8] h-[40vh] md:h-full md:flex-1"
        >
          <img
            src="/images/hero/hero-men.webp"
            alt="Mężczyźni"
            className="hero-image w-full h-full object-cover object-top transition-transform duration-700"
          />
          <div className="hero-overlay absolute inset-0 bg-black/20 transition-all duration-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-white tracking-[0.2em] font-serif drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              MĘŻCZYŹNI
            </h2>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Hero;
