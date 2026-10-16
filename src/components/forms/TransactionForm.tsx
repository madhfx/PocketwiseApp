import React, { useState } from 'react';
import { db } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';
import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/85 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-150">
      <div className="bg-[#121214] w-full max-w-md rounded-t-3xl md:rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-200">
        {/* Instagram style header */}
        <div className="p-4 flex justify-between items-center border-b border-neutral-800/80 bg-black/40">
          <button 
            type="button" 
            onClick={onClose} 
            className="text-neutral-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
          <h2 className="text-sm font-bold text-white tracking-tight">Create Transaction</h2>
          <button 
            type="button"
            onClick={handleSubmit}
            className="text-orange-400 font-semibold text-sm hover:text-orange-300"
          >
            Share
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Amount input */}
          <div className="text-center py-2">
            <span className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Enter Amount</span>
            <div className="flex items-center justify-center">
              <span className="text-3xl font-extrabold text-neutral-400 mr-1">₹</span>
              <input
                type="number"
                step="any"
                required
                autoFocus
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-48 bg-transparent text-center text-4xl font-extrabold text-white placeholder-neutral-700 focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Type Segmented Pill */}
          <div className="flex bg-[#1a1a1c] p-1 rounded-2xl border border-neutral-800/80">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                type === 'expense' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400'
              }`}
            >
              <ArrowDownCircle size={14} className="text-orange-500" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                type === 'income' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400'
              }`}
            >
              <ArrowUpCircle size={14} className="text-emerald-400" />
              <span>Income</span>
            </button>
          </div>

          {/* Merchant Quick Grid */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">Select Brand / App</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MERCHANTS.map(m => {
                const isSelected = merchant === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMerchant(m)}
                    className={`p-2 rounded-xl border flex items-center space-x-2 text-xs font-medium transition ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10 text-white shadow-sm ring-1 ring-orange-500/20'
                        : 'border-neutral-800/80 bg-[#161618] text-neutral-400 hover:bg-[#1f1f22]'
                    }`}
                  >
                    <MerchantIcon name={m} size="xs" />
                    <span className="truncate">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Merchant Name input */}
          <div>
            <input
              type="text"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full bg-[#161618] border border-neutral-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
              placeholder="Or type custom merchant name..."
            />
          </div>

          {/* Category Dropdown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#161618] border border-neutral-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-[#161618] border border-neutral-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Note input */}
          <div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-[#161618] border border-neutral-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
              placeholder="Write a caption / note..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-semibold py-3 rounded-2xl transition shadow-lg text-sm"
          >
            Post Expense
          </button>
        </form>
      </div>
    </div>
  );
};
