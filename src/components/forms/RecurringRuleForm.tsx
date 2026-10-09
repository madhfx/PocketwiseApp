import React, { useState } from 'react';
import { db } from '../../db/database';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';
import { format } from 'date-fns';

const PRESET_MERCHANTS = ['Swiggy', 'Netflix', 'Rent', 'Electricity', 'Internet', 'Gym'];
const PRESET_CATEGORIES = ['Food & Dining', 'Subscriptions', 'Rent', 'Bills & Utilities', 'Health', 'Other'];

interface Props {
  onClose: () => void;
  editRuleId?: string; // For future edit support
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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-navy-900/80 backdrop-blur-sm p-4">
      <div className="bg-navy-800 w-full max-w-md rounded-3xl border border-slate-700 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 md:zoom-in-95">
        <div className="p-4 flex justify-between items-center border-b border-slate-700 bg-slate-800/30">
          <h2 className="text-lg font-bold">New Recurring Expense</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-bold focus:outline-none focus:border-mint-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Merchant / App</label>
            <input
              type="text"
              required
              list="recurring_merchants"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-mint-500"
              placeholder="e.g. Netflix"
            />
            <datalist id="recurring_merchants">
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
              <label className="block text-xs font-medium text-slate-400 mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as any)}
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-mint-500 appearance-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-mint-500 [color-scheme:dark]"
            />
          </div>

          <div className="pt-2 border-t border-slate-700">
            <label className="block text-xs font-medium text-slate-400 mb-2">Behavior Mode</label>
            <div className="space-y-2">
              <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800 transition">
                <input
                  type="radio"
                  checked={mode === 'forecast'}
                  onChange={() => setMode('forecast')}
                  className="mt-1 accent-mint-500"
                />
                <div>
                  <div className="font-medium">Forecast Only</div>
                  <div className="text-xs text-slate-400 mt-1">Accrues in available balance, but does not create actual transaction records automatically.</div>
                </div>
              </label>
              <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800 transition">
                <input
                  type="radio"
                  checked={mode === 'auto-record'}
                  onChange={() => setMode('auto-record')}
                  className="mt-1 accent-mint-500"
                />
                <div>
                  <div className="font-medium">Auto-record</div>
                  <div className="text-xs text-slate-400 mt-1">Automatically generates actual transaction records when the date arrives.</div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-mint-500 hover:bg-mint-400 text-navy-900 font-bold py-3.5 rounded-xl transition shadow-lg shadow-mint-500/20 mt-4"
          >
            Create Rule
          </button>
        </form>
      </div>
    </div>
  );
};
