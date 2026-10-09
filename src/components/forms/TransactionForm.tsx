import React, { useState } from 'react';
import { db } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';

const PRESET_MERCHANTS = [
  'Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'BigBasket', 'Amazon', 
  'Flipkart', 'Uber', 'Ola', 'Rapido', 'Google Pay', 'PhonePe', 
  'Paytm', 'Netflix', 'YouTube', 'Spotify', 'Electricity', 'Internet', 'Rent', 'Fuel', 'Other'
];

const PRESET_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Shopping', 'Transport', 'Rent', 
  'EMIs & Loans', 'Bills & Utilities', 'Subscriptions', 'Health', 
  'Entertainment', 'Personal', 'Other'
];

interface Props {
  onClose: () => void;
}

export const TransactionForm: React.FC<Props> = ({ onClose }) => {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm
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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-navy-900/80 backdrop-blur-sm p-4">
      <div className="bg-navy-800 w-full max-w-md rounded-3xl border border-slate-700 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 md:zoom-in-95">
        <div className="p-4 flex justify-between items-center border-b border-slate-700 bg-slate-800/30">
          <h2 className="text-lg font-bold">Add Transaction</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex bg-slate-800 rounded-xl p-1 relative">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${type === 'expense' ? 'bg-navy-900 text-rose-400 shadow' : 'text-slate-400'}`}
              onClick={() => setType('expense')}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${type === 'income' ? 'bg-navy-900 text-mint-400 shadow' : 'text-slate-400'}`}
              onClick={() => setType('income')}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-bold focus:outline-none focus:border-mint-500 focus:ring-1 focus:ring-mint-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Merchant / App</label>
            <input
              type="text"
              required
              list="merchants"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-mint-500"
              placeholder="e.g. Swiggy"
            />
            <datalist id="merchants">
              {PRESET_MERCHANTS.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-mint-500 appearance-none"
              >
                {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-mint-500 [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-mint-500"
              placeholder="What was this for?"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-mint-500 hover:bg-mint-400 text-navy-900 font-bold py-3.5 rounded-xl transition shadow-lg shadow-mint-500/20 mt-4"
          >
            Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
};
