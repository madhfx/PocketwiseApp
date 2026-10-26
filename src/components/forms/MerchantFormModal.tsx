import React, { useState } from 'react';
import { db } from '../../db/database';
import { type Merchant } from '../../db/models';
import { v4 as uuidv4 } from 'uuid';
import { X, Upload, Globe, Image as ImageIcon, Star, CheckCircle2 } from 'lucide-react';
import { MerchantIcon } from '../ui/MerchantIcon';

const PRESET_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Shopping', 'Transport', 'Rent', 
  'Bills & Utilities', 'Subscriptions', 'Health', 'Salary', 'Freelance', 'Other'
];

interface Props {
  onClose: () => void;
  editMerchant?: Merchant | null;
  defaultType?: 'merchant' | 'client' | 'both';
  onSuccess?: (merchantName: string) => void;
}

export const MerchantFormModal: React.FC<Props> = ({ 
  onClose, 
  editMerchant, 
  defaultType = 'merchant',
  onSuccess 
}) => {
  const [name, setName] = useState(editMerchant?.name || '');
  const [type, setType] = useState<'merchant' | 'client' | 'both'>(editMerchant?.type || defaultType);
  const [defaultCategory, setDefaultCategory] = useState(editMerchant?.defaultCategory || PRESET_CATEGORIES[0]);
  const [domain, setDomain] = useState(editMerchant?.domain || '');
  const [logoUrl, setLogoUrl] = useState(editMerchant?.logoUrl || '');
  const [isFeatured, setIsFeatured] = useState<boolean>(editMerchant?.isFeatured ?? false);
  const [logoMode, setLogoMode] = useState<'domain' | 'url' | 'upload'>(
    editMerchant?.logoUrl?.startsWith('data:') ? 'upload' : editMerchant?.logoUrl ? 'url' : 'domain'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  // Handle local image file upload (converts to Base64 data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Please upload an image smaller than 2MB.');
      return;
    }

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const cleanName = name.trim();

    try {
      if (editMerchant) {
        await db.merchants.update(editMerchant.id, {
          name: cleanName,
          type,
          defaultCategory,
          domain: domain.trim().toLowerCase(),
          logoUrl: logoUrl.trim(),
          isFeatured,
          updatedAt: Date.now()
        });
      } else {
        await db.merchants.add({
          id: `merchant_${uuidv4().slice(0, 8)}`,
          name: cleanName,
          type,
          defaultCategory,
          domain: domain.trim().toLowerCase(),
          logoUrl: logoUrl.trim(),
          isFeatured,
          isPreset: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      if (onSuccess) onSuccess(cleanName);
      onClose();
    } catch (err) {
      console.error('Failed to save merchant:', err);
      alert('Error saving merchant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-90"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            {editMerchant ? 'Edit Entity' : 'Add Merchant or Client'}
          </h2>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="text-indigo-600 font-bold text-xs hover:text-indigo-700 disabled:opacity-40 active:scale-95 transition"
          >
            Save
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {/* Live Preview Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <MerchantIcon 
                name={name || 'Brand Name'} 
                domain={domain} 
                logoUrl={logoUrl} 
                size="lg" 
              />
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  {name || 'New Brand / Client'}
                </span>
                <span className="text-xs text-slate-500 capitalize">
                  {type === 'both' ? 'Merchant & Client' : type} • {defaultCategory}
                </span>
              </div>
            </div>

            {isFeatured && (
              <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Star size={12} className="fill-amber-500" />
                <span>Featured</span>
              </span>
            )}
          </div>

          {/* Entity Type Segmented Switcher */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
              ENTITY TYPE
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('merchant')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  type === 'merchant'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Merchant (Vendor)
              </button>
              <button
                type="button"
                onClick={() => setType('client')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  type === 'client'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Client (Income)
              </button>
              <button
                type="button"
                onClick={() => setType('both')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  type === 'both'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Both
              </button>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
              NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Starbucks, Cult.fit, Acme Corp"
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Default Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
              DEFAULT CATEGORY
            </label>
            <select
              value={defaultCategory}
              onChange={e => setDefaultCategory(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
            >
              {PRESET_CATEGORIES.map(c => (
                <option key={c} value={c} className="bg-white text-slate-800">{c}</option>
              ))}
            </select>
          </div>

          {/* Logo Source Mode Pills */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                LOGO & BRANDING
              </label>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setLogoMode('domain')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                    logoMode === 'domain'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Domain
                </button>
                <button
                  type="button"
                  onClick={() => setLogoMode('upload')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                    logoMode === 'upload'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setLogoMode('url')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                    logoMode === 'url'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Direct URL
                </button>
              </div>
            </div>

            {/* Mode 1: Domain Name (Auto Fetch Logo) */}
            {logoMode === 'domain' && (
              <div className="space-y-1.5">
                <div className="relative">
                  <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="e.g. starbucks.com, cult.fit, amazon.in"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 px-1">
                  Enter company website domain to automatically load their high-res logo.
                </p>
              </div>
            )}

            {/* Mode 2: Local File Upload */}
            {logoMode === 'upload' && (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 rounded-2xl p-5 cursor-pointer transition group">
                  <Upload size={22} className="text-slate-400 group-hover:text-indigo-600 transition" />
                  <span className="text-xs font-semibold text-slate-700 mt-2">
                    {uploadFileName || 'Click to select logo image'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG, WebP up to 2MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => { setLogoUrl(''); setUploadFileName(null); }}
                    className="text-[11px] text-rose-500 hover:underline block"
                  >
                    Remove uploaded image
                  </button>
                )}
              </div>
            )}

            {/* Mode 3: Direct URL */}
            {logoMode === 'url' && (
              <div className="space-y-1.5">
                <div className="relative">
                  <ImageIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 px-1">
                  Direct link to a hosted PNG/SVG/JPEG logo.
                </p>
              </div>
            )}
          </div>

          {/* Pin to Dashboard Fast Launch Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-slate-800 block">
                Feature on Dashboard
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Show in 1-tap fast launch brand grid on Overview
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isFeatured} 
                onChange={e => setIsFeatured(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 active:scale-95 transition shadow-lg shadow-indigo-500/25"
            >
              <CheckCircle2 size={16} />
              <span>{editMerchant ? 'Update Entity' : 'Save Merchant / Client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
