import React, { useState } from 'react';

export const MERCHANT_DOMAINS: Record<string, string> = {
  'Swiggy': 'swiggy.com',
  'Zomato': 'zomato.com',
  'Blinkit': 'blinkit.com',
  'Zepto': 'zeptonow.com',
  'BigBasket': 'bigbasket.com',
  'Amazon': 'amazon.in',
  'Flipkart': 'flipkart.com',
  'Uber': 'uber.com',
  'Ola': 'olacabs.com',
  'Rapido': 'rapido.bike',
  'Netflix': 'netflix.com',
  'YouTube': 'youtube.com',
  'Spotify': 'spotify.com',
  'Google Pay': 'pay.google.com',
  'PhonePe': 'phonepe.com',
  'Paytm': 'paytm.com',
  'Rent': 'nobroker.in',
  'Fuel': 'iocl.com'
};

interface MerchantIconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const MerchantIcon: React.FC<MerchantIconProps> = ({ name, size = 'md', className = '' }) => {
  const [error, setError] = useState(false);
  const domain = MERCHANT_DOMAINS[name];

  const sizeClass = {
    xs: 'w-4 h-4 text-[9px] rounded-md',
    sm: 'w-6 h-6 text-[10px] rounded-lg',
    md: 'w-8 h-8 text-xs rounded-xl',
    lg: 'w-10 h-10 text-sm rounded-xl'
  }[size];

  if (!domain || error) {
    return (
      <div className={`${sizeClass} bg-neutral-800 text-neutral-300 border border-neutral-700/80 flex items-center justify-center font-bold uppercase shrink-0 shadow-sm ${className}`}>
        {name.substring(0, 2)}
      </div>
    );
  }

  return (
    <img 
      src={`https://logo.clearbit.com/${domain}`} 
      alt={name}
      loading="lazy"
      onError={() => setError(true)}
      className={`${sizeClass} object-cover shrink-0 bg-white p-[2px] shadow-sm border border-neutral-800 ${className}`}
    />
  );
};
