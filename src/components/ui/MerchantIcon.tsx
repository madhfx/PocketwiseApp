import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';

export const STATIC_MERCHANT_DOMAINS: Record<string, string> = {
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
  domain?: string;
  logoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const MerchantIcon: React.FC<MerchantIconProps> = ({ 
  name, 
  domain: directDomain, 
  logoUrl: directLogoUrl, 
  size = 'md', 
  className = '' 
}) => {
  const [imgErrorLevel, setImgErrorLevel] = useState(0);

  // Look up merchant from database for custom domains and uploaded logos
  const dbMerchant = useLiveQuery(
    () => db.merchants.where('name').equalsIgnoreCase(name).first(),
    [name]
  );

  const activeLogoUrl = directLogoUrl || dbMerchant?.logoUrl;
  const activeDomain = directDomain || dbMerchant?.domain || STATIC_MERCHANT_DOMAINS[name];

  const sizeClass = {
    xs: 'w-5 h-5 text-[9px] rounded-md',
    sm: 'w-7 h-7 text-[10px] rounded-lg',
    md: 'w-10 h-10 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-xl',
    xl: 'w-14 h-14 text-base rounded-2xl'
  }[size];

  // 1. Direct custom logo (uploaded base64 or custom image URL)
  if (activeLogoUrl && imgErrorLevel === 0) {
    return (
      <img
        src={activeLogoUrl}
        alt={name}
        loading="lazy"
        onError={() => setImgErrorLevel(1)}
        className={`${sizeClass} object-cover shrink-0 bg-white p-[2px] shadow-xs border border-slate-200/80 transition-transform ${className}`}
      />
    );
  }

  // 2. Fetch by domain with fallback chain (Clearbit -> Google Favicon -> Fallback Initials)
  if (activeDomain) {
    if (imgErrorLevel === 0) {
      return (
        <img
          src={`https://logo.clearbit.com/${activeDomain}`}
          alt={name}
          loading="lazy"
          onError={() => setImgErrorLevel(1)}
          className={`${sizeClass} object-cover shrink-0 bg-white p-[2px] shadow-xs border border-slate-200/80 transition-transform ${className}`}
        />
      );
    }
    if (imgErrorLevel === 1) {
      return (
        <img
          src={`https://www.google.com/s2/favicons?domain=${activeDomain}&sz=128`}
          alt={name}
          loading="lazy"
          onError={() => setImgErrorLevel(2)}
          className={`${sizeClass} object-contain shrink-0 bg-white p-1 shadow-xs border border-slate-200/80 transition-transform ${className}`}
        />
      );
    }
  }

  // 3. Fallback initials badge
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || name.substring(0, 2).toUpperCase();

  return (
    <div className={`${sizeClass} bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold tracking-tight shrink-0 shadow-xs ${className}`}>
      {initials}
    </div>
  );
};
