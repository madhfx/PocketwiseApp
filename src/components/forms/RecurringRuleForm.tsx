import React, { useState } from 'react';
import { db } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';
import { X, Clock } from 'lucide-react';
import { format } from 'date-fns';

const PRESET_MERCHANTS = ['Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'Netflix', 'Amazon', 'Rent', 'Electricity', 'Internet', 'Gym'];
const PRESET_CATEGORIES = ['Food & Dining', 'Subscriptions', 'Rent', 'Bills & Utilities', 'Health', 'Other'];

interface Props {
  onClose: () => void;
  editRuleId?: string;
}

export const RecurringRuleForm: React.FC<Props> = ({ onClose }) => {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mode, setMode] = useState<'forecast' | 'auto-record'>('forecast');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    await db.recurringRules.add({
      id: uuidv4(),
      merchantName: merchant || 'Unknown',
      amount: Number(amount),
      category,
      frequency,
      interval: 1,
      startDate,
      mode,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-200 border border-slate-200">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-90"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recurring Commitment</h2>
          </div>
          <button 
            type="button" 
            onClick={handleSubmit}
            className="text-indigo-600 font-bold text-xs hover:text-indigo-700 active:scale-95 transition"
          >
            Save
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">AMOUNT</label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 py-2.5 focus-within:border-indigo-500 transition">
              <span className="text-slate-400 font-bold text-base mr-2">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-transparent text-base font-bold text-slate-900 placeholder-slate-300 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">MERCHANT / COMMITMENT NAME</label>
            <input
              type="text"
              required
              list="recurring_merchants"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              placeholder="e.g. Swiggy, Netflix, House Rent"
            />
            <datalist id="recurring_merchants">
              {PRESET_MERCHANTS.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">CATEGORY</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
              >
                {PRESET_CATEGORIES.map(c => <option key={c} value={c} className="bg-white text-slate-800">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">FREQUENCY</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="daily" className="bg-white text-slate-800">Daily</option>
                <option value="weekly" className="bg-white text-slate-800">Weekly</option>
                <option value="monthly" className="bg-white text-slate-800">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">START DATE</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase">ACCRUAL MODE</label>
            <div className="space-y-2">
              <label className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${
                mode === 'forecast' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  checked={mode === 'forecast'}
                  onChange={() => setMode('forecast')}
                  className="mt-0.5 accent-indigo-600"
                />
                <div>
                  <div className="font-semibold text-xs text-slate-900">Forecast Mode (Recommended)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Deducts daily accruals from Available Balance without generating clutter.</div>
                </div>
              </label>

              <label className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${
                mode === 'auto-record' ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  checked={mode === 'auto-record'}
                  onChange={() => setMode('auto-record')}
                  className="mt-0.5 accent-purple-600"
                />
                <div>
                  <div className="font-semibold text-xs text-slate-900">Auto-Record Mode</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Automatically records verified transaction rows as occurrences come due.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-indigo-500/25 active:scale-95 text-xs"
            >
              Save Recurring Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
