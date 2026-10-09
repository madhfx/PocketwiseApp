import React, { useState } from 'react';

export const MERCHANT_DOMAINS: Record<string, string> = {
  'Swiggy': 'swiggy.com',
  'Zomato': 'zomato.com',
  'Blinkit': 'blinkit.com',
  'Zepto': 'zeptonow.com',
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
};

interface MerchantIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MerchantIcon: React.FC<MerchantIconProps> = ({ name, size = 'md' }) => {
  const [error, setError] = useState(false);
  const domain = MERCHANT_DOMAINS[name];

  const sizeClass = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  }[size];

  if (!domain || error) {
    return (
      <div className={`${sizeClass} rounded-xl bg-white text-black flex items-center justify-center font-bold uppercase shrink-0`}>
        {name.substring(0, 2)}
      </div>
    );
  }

  return (
    <img 
      src={`https://logo.clearbit.com/${domain}`} 
      alt={name}
      onError={() => setError(true)}
      className={`${sizeClass} rounded-xl object-cover shrink-0 bg-white p-[2px]`}
    />
  );
};
