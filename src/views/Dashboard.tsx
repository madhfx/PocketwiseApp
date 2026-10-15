import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { RecurringEngine } from '../services/recurringEngine';
import { format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { BarChart2, ArrowDownCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MerchantIcon } from '../components/ui/MerchantIcon';

const PRESET_MERCHANTS = [
  'Swiggy', 'Zomato', 'Blinkit',
  'Zepto', 'Amazon', 'Flipkart',
  'Uber', 'Ola', 'Rapido',
  'Netflix', 'YouTube', 'Spotify',
  'Google Pay', 'PhonePe', 'Other'
];

const PRESET_CATEGORIES = [
  'Food & groceries',
  'Shopping',
  'Travel & transport',
  'Subscriptions',
  'Other'
];

const COLORS = ['#f97316', '#eab308', '#ef4444']; // Orange, Yellow, Red for the top 3

const Dashboard: React.FC = () => {
  const [currentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const transactions = useLiveQuery(
    () => db.transactions
      .where('date')
      .between(monthStart.getTime(), monthEnd.getTime() + 86400000)
      .toArray(),
    [monthStart.getTime(), monthEnd.getTime()]
  );

  const [accruedRecurring, setAccruedRecurring] = useState(0);

  useEffect(() => {
    const now = new Date();
    const targetDate = isSameMonth(now, currentDate) ? now : monthEnd;
    
    RecurringEngine.getUnrecordedAccruedAmount(monthStart, targetDate)
      .then(setAccruedRecurring);
  }, [currentDate, transactions, monthStart, monthEnd]);

  const expenses = (transactions || []).filter(t => t.type === 'expense');
  const actualExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = actualExpenses + accruedRecurring;

  // Top Merchants
  const merchantData = expenses.reduce((acc, t) => {
    if (!acc[t.merchantName]) acc[t.merchantName] = 0;
    acc[t.merchantName] += t.amount;
    return acc;
  }, {} as Record<string, number>);

  const topMerchants = Object.keys(merchantData)
    .map(name => ({ name, amount: merchantData[name] }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
    
  const maxMerchantAmount = topMerchants.length > 0 ? topMerchants[0].amount : 1;

  // Quick Add State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('Swiggy');
  const [category, setCategory] = useState('Food & groceries');
  const [note, setNote] = useState('');

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    await db.transactions.add({
      id: uuidv4(),
      amount: Number(amount),
      merchantName: merchant || 'Unknown',
      category,
      date: new Date().getTime(),
      note,
      type: 'expense',
      source: 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    setAmount('');
    setNote('');
    // Provide a small visual feedback here if desired
  };

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Header */}
      <header className="flex justify-between items-center pt-2">
        <h1 className="text-xl font-bold text-white tracking-tight">Pocketwise</h1>
        <BarChart2 className="text-white" size={24} />
      </header>

      {/* Spend Total */}
      <div>
        <p className="text-xs text-neutral-400 font-semibold tracking-wider uppercase mb-2">
          {format(currentDate, 'MMMM')} SPENDING
        </p>
        <div className="text-4xl font-bold text-white mb-2">
          ₹{totalSpent.toLocaleString('en-IN')}
        </div>
        <p className="text-xs text-neutral-500">Live dashboard</p>
      </div>

      <hr className="border-t border-neutral-900" />

      {/* Where your money goes */}
      <div>
        <h2 className="text-sm font-bold text-white mb-4">Where your money goes</h2>
        {topMerchants.length === 0 ? (
          <p className="text-sm text-neutral-600 italic">No expenses yet this month.</p>
        ) : (
          <div className="space-y-5">
            {topMerchants.map((item, idx) => (
              <div key={item.name} className="relative">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-3 z-10">
                    <MerchantIcon name={item.name} />
                    <span className="font-semibold text-sm text-white">{item.name}</span>
                  </div>
                  <span className="font-bold text-sm text-white z-10">₹{item.amount.toLocaleString('en-IN')}</span>
                </div>
                {/* Progress bar line */}
                <div className="h-1.5 w-full bg-[#111111] rounded-full overflow-hidden flex ml-11" style={{ width: 'calc(100% - 44px)' }}>
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${(item.amount / maxMerchantAmount) * 100}%`,
                      backgroundColor: COLORS[idx % COLORS.length]
                    }} 
                  />
                </div>
              </div>
            ))}
            <p className="text-[10px] text-neutral-500 mt-2">Top 3 merchants by actual spending.</p>
          </div>
        )}
      </div>

      <hr className="border-t border-neutral-900" />

      {/* Quick Add Expense */}
      <div>
        <h2 className="text-sm font-bold text-white mb-4">Quick add expense</h2>
        
        <form onSubmit={handleAddExpense} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-xs text-neutral-400 mb-2">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-neutral-600"
              placeholder="Enter amount"
            />
          </div>

          {/* Merchant Grid */}
          <div>
            <label className="block text-xs text-neutral-400 mb-2">Choose app or merchant</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MERCHANTS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMerchant(m)}
                  className={`py-2 text-xs font-medium rounded-lg border transition ${
                    merchant === m 
                      ? 'border-orange-600 bg-[#161616] text-white' 
                      : 'border-transparent bg-[#1c1c1e] text-neutral-400 hover:bg-[#2c2c2e]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-neutral-400 mb-3">Category</label>
            <div className="space-y-3">
              {PRESET_CATEGORIES.map(c => (
                <label 
                  key={c} 
                  onClick={() => setCategory(c)}
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                    category === c ? 'border-white' : 'border-neutral-600 group-hover:border-neutral-400'
                  }`}>
                    {category === c && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                  <span className="text-sm text-neutral-200">{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-neutral-600"
              placeholder="Note (optional)"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#111111] hover:bg-[#1c1c1e] text-neutral-300 text-sm font-medium py-3.5 rounded-full transition flex items-center justify-center"
          >
            Add expense
            <ArrowDownCircle size={16} className="ml-2 text-neutral-500" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
