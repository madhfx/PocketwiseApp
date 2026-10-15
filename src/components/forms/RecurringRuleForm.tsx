import React, { useState } from 'react';
import { db } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';
import { X, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e0e10] w-full max-w-md rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-200">
        <div className="p-4 flex justify-between items-center border-b border-neutral-800/80 bg-neutral-900/40">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-orange-500" />
            <h2 className="text-sm font-bold text-white tracking-tight">New Recurring Commitment</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Amount (₹)</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-neutral-500 font-bold text-lg">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-[#161618] border border-neutral-800 rounded-2xl pl-8 pr-4 py-3 text-xl font-bold text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 transition"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Merchant / Commitment Name</label>
            <input
              type="text"
              required
              list="recurring_merchants"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full bg-[#161618] border border-neutral-800 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition"
              placeholder="e.g. Swiggy, Netflix, House Rent"
            />
            <datalist id="recurring_merchants">
              {PRESET_MERCHANTS.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#161618] border border-neutral-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-700"
              >
                {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as any)}
                className="w-full bg-[#161618] border border-neutral-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-700"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-[#161618] border border-neutral-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 [color-scheme:dark]"
            />
          </div>

          <div className="pt-2 border-t border-neutral-800/80">
            <label className="block text-xs font-medium text-neutral-400 mb-2">Behavior Mode</label>
            <div className="space-y-2">
              <label className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition ${
                mode === 'forecast' ? 'border-orange-500/50 bg-orange-500/5' : 'border-neutral-800 bg-[#161618]'
              }`}>
                <input
                  type="radio"
                  checked={mode === 'forecast'}
                  onChange={() => setMode('forecast')}
                  className="mt-0.5 accent-orange-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Forecast Mode (Safe)</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Accrues in available balance calculation, but creates no unverified transaction records.</div>
                </div>
              </label>

              <label className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition ${
                mode === 'auto-record' ? 'border-orange-500/50 bg-orange-500/5' : 'border-neutral-800 bg-[#161618]'
              }`}>
                <input
                  type="radio"
                  checked={mode === 'auto-record'}
                  onChange={() => setMode('auto-record')}
                  className="mt-0.5 accent-orange-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Auto-Record Mode</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Generates automated transaction records when occurrences become due.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-semibold py-3 rounded-2xl transition shadow-lg shadow-orange-600/20 active:scale-[0.99] text-sm"
            >
              Save Recurring Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
