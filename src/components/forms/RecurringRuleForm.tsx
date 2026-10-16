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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="glass-dock w-full max-w-md rounded-t-[36px] md:rounded-[36px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-200 border-t border-x border-white/20">
        <div className="px-5 py-4 flex justify-between items-center border-b border-white/10">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-90"
          >
            <X size={16} />
          </button>
          <div className="flex items-center space-x-1.5">
            <Clock size={15} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Recurring Rule</h2>
          </div>
          <button 
            type="button" 
            onClick={handleSubmit}
            className="text-blue-400 font-semibold text-xs hover:text-blue-300 active:scale-95 transition"
          >
            Done
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">AMOUNT</label>
            <div className="glass-card-subtle rounded-2xl flex items-center px-4 py-2.5">
              <span className="text-zinc-500 font-bold text-base mr-2">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-transparent text-base font-bold text-white placeholder-zinc-600 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">MERCHANT / EXPENSE NAME</label>
            <input
              type="text"
              required
              list="recurring_merchants"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full glass-card-subtle rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
              placeholder="e.g. Swiggy, Netflix, House Rent"
            />
            <datalist id="recurring_merchants">
              {PRESET_MERCHANTS.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>

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
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">FREQUENCY</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as any)}
                className="w-full glass-card-subtle rounded-2xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="daily" className="bg-zinc-900 text-white">Daily</option>
                <option value="weekly" className="bg-zinc-900 text-white">Weekly</option>
                <option value="monthly" className="bg-zinc-900 text-white">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">START DATE</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full glass-card-subtle rounded-2xl px-4 py-2 text-xs text-white focus:outline-none [color-scheme:dark]"
            />
          </div>

          <div className="pt-2 border-t border-white/[0.08]">
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2">MODE</label>
            <div className="space-y-2">
              <label className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition ${
                mode === 'forecast' ? 'bg-blue-600/20 border-blue-500/60' : 'glass-card-subtle'
              }`}>
                <input
                  type="radio"
                  checked={mode === 'forecast'}
                  onChange={() => setMode('forecast')}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Forecast Mode</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Accrues in available balance, creating no unverified entries.</div>
                </div>
              </label>

              <label className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition ${
                mode === 'auto-record' ? 'bg-purple-600/20 border-purple-500/60' : 'glass-card-subtle'
              }`}>
                <input
                  type="radio"
                  checked={mode === 'auto-record'}
                  onChange={() => setMode('auto-record')}
                  className="mt-0.5 accent-purple-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Auto-Record Mode</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Generates automated transaction records when occurrences become due.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold py-3 rounded-2xl transition shadow-lg shadow-indigo-500/25 border border-white/20 active:scale-95 text-xs"
            >
              Save Recurring Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
