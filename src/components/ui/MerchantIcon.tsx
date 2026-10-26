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
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const MerchantIcon: React.FC<MerchantIconProps> = ({ name, size = 'md', className = '' }) => {
  const [error, setError] = useState(false);
  const domain = MERCHANT_DOMAINS[name];

  const sizeClass = {
    xs: 'w-5 h-5 text-[9px] rounded-md',
    sm: 'w-7 h-7 text-[10px] rounded-lg',
    md: 'w-10 h-10 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-xl',
    xl: 'w-14 h-14 text-base rounded-2xl'
  }[size];

  if (!domain || error) {
    return (
      <div className={`${sizeClass} bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold tracking-tight uppercase shrink-0 shadow-xs ${className}`}>
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
      className={`${sizeClass} object-cover shrink-0 bg-white p-[2px] shadow-xs border border-slate-200/80 transition-transform ${className}`}
    />
  );
};
