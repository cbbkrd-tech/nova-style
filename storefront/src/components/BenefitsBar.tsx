import React from 'react';
import { TruckIcon, SparklesIcon, ShieldIcon, RefreshIcon } from './Icons';

const BenefitsBar: React.FC = () => {
  const benefits = [
    {
      icon: <TruckIcon />,
      title: 'DARMOWA DOSTAWA',
      description: 'Przy zakupach za minimum 400 zł'
    },
    {
      icon: <SparklesIcon />,
      title: 'NOWE KOLEKCJE',
      description: 'w każdym miesiącu'
    },
    {
      icon: <ShieldIcon />,
      title: 'BEZPIECZEŃSTWO ZAKUPÓW',
      description: 'Płać wygodnie i bez obaw'
    },
    {
      icon: <RefreshIcon />,
      title: 'ZAKUPY BEZ RYZYKA',
      description: '14 dni na zwrot lub wymianę'
    }
  ];

  return (
    <div className="bg-warm-beige py-10 md:py-12">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="text-charcoal mb-3 flex justify-center">
                {benefit.icon}
              </div>
              <h3 className="text-[10px] md:text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
                {benefit.title}
              </h3>
              <p className="text-[10px] md:text-xs text-charcoal/70">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BenefitsBar;
