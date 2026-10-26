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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-200 border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-90"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Record Transaction</h2>
          <button 
            type="button"
            onClick={handleSubmit}
            className="text-indigo-600 font-bold text-xs hover:text-indigo-700 active:scale-95 transition"
          >
            Save
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Big Amount Display */}
          <div className="text-center py-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-1">AMOUNT</span>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-3xl font-extrabold text-slate-400">₹</span>
              <input
                type="number"
                step="any"
                required
                autoFocus
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-48 bg-transparent text-center text-4xl font-extrabold text-slate-900 placeholder-slate-300 focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Segmented Type Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                type === 'expense' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <ArrowDownRight size={14} className="text-rose-500" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                type === 'income' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <ArrowUpRight size={14} className="text-emerald-500" />
              <span>Income</span>
            </button>
          </div>

          {/* App / Merchant Selector Grid */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase">APP OR VENDOR</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MERCHANTS.map(m => {
                const isSelected = merchant === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMerchant(m)}
                    className={`p-2 rounded-xl border flex items-center space-x-2 text-xs font-medium transition active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold shadow-xs'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              placeholder="Or type custom vendor name..."
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">CATEGORY</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
              >
                {PRESET_CATEGORIES.map(c => <option key={c} value={c} className="bg-white text-slate-800">{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">DATE & TIME</label>
              <input
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add note (optional)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-indigo-500/25 active:scale-95 text-xs"
          >
            Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
};
