import React, { useState } from 'react';
import { db } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { MerchantIcon } from '../ui/MerchantIcon';

const PRESET_MERCHANTS = [
  'Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'Amazon', 
  'Flipkart', 'Uber', 'Ola', 'Rapido', 'Google Pay', 
  'PhonePe', 'Paytm', 'Netflix', 'YouTube', 'Spotify'
];

const PRESET_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Shopping', 'Transport', 'Rent', 
  'Bills & Utilities', 'Subscriptions', 'Health', 'Entertainment', 'Other'
];

interface Props {
  onClose: () => void;
  defaultMerchant?: string;
}

export const TransactionForm: React.FC<Props> = ({ onClose, defaultMerchant }) => {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState(defaultMerchant || 'Swiggy');
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    await db.transactions.add({
      id: uuidv4(),
      amount: Number(amount),
      merchantName: merchant || 'Unknown',
      category,
      date: new Date(date).getTime(),
      note,
      type,
      source: 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="glass-dock w-full max-w-md rounded-t-[36px] md:rounded-[36px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-200 border-t border-x border-white/20">
        {/* iOS Glass Modal Header */}
        <div className="px-5 py-4 flex justify-between items-center border-b border-white/10">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-90"
          >
            <X size={16} />
          </button>
          <h2 className="text-sm font-bold text-white tracking-tight">New Transaction</h2>
          <button 
            type="button"
            onClick={handleSubmit}
            className="text-blue-400 font-semibold text-xs hover:text-blue-300 active:scale-95 transition"
          >
            Done
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* iOS Big Amount Display */}
          <div className="text-center py-2">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block mb-1">AMOUNT</span>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-3xl font-bold text-white/50">₹</span>
              <input
                type="number"
                step="any"
                required
                autoFocus
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-48 bg-transparent text-center text-4xl font-extrabold text-white placeholder-zinc-700 focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* iOS Segmented Pill Switcher */}
          <div className="flex glass-card-subtle p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                type === 'expense' ? 'bg-white/15 text-white shadow-sm border border-white/15' : 'text-zinc-400'
              }`}
            >
              <ArrowDownRight size={14} className="text-rose-400" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                type === 'income' ? 'bg-white/15 text-white shadow-sm border border-white/15' : 'text-zinc-400'
              }`}
            >
              <ArrowUpRight size={14} className="text-emerald-400" />
              <span>Income</span>
            </button>
          </div>

          {/* App / Merchant Selector Grid */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2">APP OR MERCHANT</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MERCHANTS.map(m => {
                const isSelected = merchant === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMerchant(m)}
                    className={`p-2 rounded-2xl border flex items-center space-x-2 text-xs font-medium transition active:scale-95 ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-500/80 text-white shadow-sm shadow-blue-500/20'
                        : 'glass-card-subtle text-zinc-300 hover:text-white'
                    }`}
                  >
                    <MerchantIcon name={m} size="xs" />
                    <span className="truncate">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Name */}
          <div>
            <input
              type="text"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full glass-card-subtle rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
              placeholder="Or type custom merchant..."
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">CATEGORY</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full glass-card-subtle rounded-2xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {PRESET_CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900 text-white">{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">DATE & TIME</label>
              <input
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full glass-card-subtle rounded-2xl px-3 py-2 text-xs text-white focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add note..."
              className="w-full glass-card-subtle rounded-2xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold py-3 rounded-2xl transition shadow-lg shadow-indigo-500/25 border border-white/20 active:scale-95 text-xs"
          >
            Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
};
