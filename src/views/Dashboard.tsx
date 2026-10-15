import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { RecurringEngine } from '../services/recurringEngine';
import { format, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, Sparkles, ArrowDownCircle } from 'lucide-react';
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
  { label: 'Food & groceries', icon: '🍔' },
  { label: 'Shopping', icon: '🛍️' },
  { label: 'Travel & transport', icon: '🚕' },
  { label: 'Subscriptions', icon: '🎬' },
  { label: 'Other', icon: '💳' }
];

const COLORS = ['#f97316', '#eab308', '#ef4444'];

const Dashboard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 10)); // October 2026 default demo month
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthKey = format(currentDate, 'yyyy-MM');

  // Live queries
  const transactions = useLiveQuery(
    () => db.transactions
      .where('date')
      .between(monthStart.getTime(), monthEnd.getTime() + 86400000)
      .toArray(),
    [monthStart.getTime(), monthEnd.getTime()]
  );

  const monthlyIncome = useLiveQuery(
    () => db.monthlyIncomes.where('month').equals(monthKey).first(),
    [monthKey]
  );

  const [accruedRecurring, setAccruedRecurring] = useState(0);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const targetDate = isSameMonth(now, currentDate) ? now : monthEnd;
    
    RecurringEngine.getUnrecordedAccruedAmount(monthStart, targetDate)
      .then(setAccruedRecurring);
  }, [currentDate, transactions, monthStart, monthEnd]);

  const expenses = (transactions || []).filter(t => t.type === 'expense');
  const actualExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = actualExpenses + accruedRecurring;

  const totalIncome = (monthlyIncome?.baseSalary || 0) + (monthlyIncome?.additionalIncome || 0);
  const availableBalance = totalIncome > 0 ? (totalIncome - totalSpent) : 0;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((availableBalance / totalIncome) * 100)) : 0;

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

    const numAmount = Number(amount);
    await db.transactions.add({
      id: uuidv4(),
      amount: numAmount,
      merchantName: merchant || 'Unknown',
      category,
      date: currentDate.getTime(),
      note,
      type: 'expense',
      source: 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    setSuccessToast(`Added ₹${numAmount.toLocaleString('en-IN')} to ${merchant}`);
    setAmount('');
    setNote('');

    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  return (
    <div className="space-y-7 font-sans pb-10">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 text-white border border-neutral-800 px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={16} className="text-orange-500" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header with Month Navigation */}
      <header className="flex justify-between items-center pt-1">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Pocketwise</span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          </h1>
        </div>

        {/* Month Selector Pill */}
        <div className="flex items-center space-x-1 bg-[#121212] border border-neutral-800/90 rounded-full px-2 py-1 shadow-sm">
          <button 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-neutral-200 px-2 tracking-wide min-w-[84px] text-center">
            {format(currentDate, 'MMM yyyy')}
          </span>
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {/* Primary Spending Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#121214] to-[#0a0a0c] p-6 border border-neutral-900/90 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-start mb-2">
          <p className="text-[11px] text-neutral-400 font-semibold tracking-wider uppercase">
            {format(currentDate, 'MMMM')} SPENDING
          </p>
          {totalIncome > 0 && (
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {savingsRate}% saved
            </span>
          )}
        </div>

        <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          ₹{totalSpent.toLocaleString('en-IN')}
        </div>

        {/* Financial Stat Breakdown Chips */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-900">
          <div className="bg-[#18181b]/50 p-2.5 rounded-2xl border border-neutral-800/50">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Remaining</span>
            <span className={`text-sm font-bold block mt-0.5 ${availableBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{availableBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#18181b]/50 p-2.5 rounded-2xl border border-neutral-800/50">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Income</span>
            <span className="text-sm font-bold text-neutral-200 block mt-0.5">
              ₹{totalIncome.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#18181b]/50 p-2.5 rounded-2xl border border-neutral-800/50">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Accrued Rec.</span>
            <span className="text-sm font-bold text-orange-400 block mt-0.5">
              ₹{accruedRecurring.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Where your money goes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Where your money goes</span>
            <TrendingUp size={14} className="text-orange-500" />
          </h2>
          {topMerchants.length > 0 && (
            <span className="text-xs text-neutral-500 font-medium">Top {topMerchants.length}</span>
          )}
        </div>

        {topMerchants.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-neutral-900 text-center">
            <p className="text-sm text-neutral-500">No recorded expenses for this month.</p>
          </div>
        ) : (
          <div className="space-y-4 bg-[#0a0a0a] p-4 rounded-3xl border border-neutral-900/90 shadow-sm">
            {topMerchants.map((item, idx) => {
              const percentage = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0;
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <MerchantIcon name={item.name} size="md" />
                      <div>
                        <span className="font-semibold text-sm text-white block">{item.name}</span>
                        <span className="text-[11px] text-neutral-500">{percentage}% of spending</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-white">₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Progress bar line */}
                  <div className="h-1.5 w-full bg-[#171717] rounded-full overflow-hidden flex ml-11" style={{ width: 'calc(100% - 44px)' }}>
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${(item.amount / maxMerchantAmount) * 100}%`,
                        backgroundColor: COLORS[idx % COLORS.length]
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Expense Section */}
      <div className="rounded-3xl bg-[#0a0a0a] p-5 border border-neutral-900/90 shadow-lg space-y-5">
        <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
          <span>Quick add expense</span>
          <Sparkles size={14} className="text-orange-500" />
        </h2>
        
        <form onSubmit={handleAddExpense} className="space-y-5">
          {/* Amount Input */}
          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-1.5">Amount (₹)</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-neutral-500 font-bold text-base">₹</span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-[#141416] border border-neutral-800 rounded-2xl pl-8 pr-4 py-3 text-base font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/50 transition"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* App / Merchant Grid */}
          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-2">Choose app or merchant</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MERCHANTS.map(m => {
                const isSelected = merchant === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMerchant(m)}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border flex items-center justify-center space-x-2 transition-all duration-150 ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-500/10 text-white shadow-sm ring-1 ring-orange-500/30' 
                        : 'border-neutral-800/80 bg-[#161618] text-neutral-400 hover:bg-[#1e1e22] hover:text-neutral-200'
                    }`}
                  >
                    <MerchantIcon name={m} size="xs" />
                    <span className="truncate">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-2.5">Category</label>
            <div className="space-y-2">
              {PRESET_CATEGORIES.map(c => {
                const isSelected = category === c.label;
                return (
                  <div 
                    key={c.label} 
                    onClick={() => setCategory(c.label)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-neutral-900 border-neutral-700 text-white'
                        : 'bg-[#121214] border-neutral-800/60 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-sm">{c.icon}</span>
                      <span className="text-xs font-medium">{c.label}</span>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                      isSelected ? 'border-orange-500' : 'border-neutral-700'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-[#141416] border border-neutral-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition"
              placeholder="Note (optional)"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-sm font-semibold py-3.5 rounded-2xl transition shadow-lg shadow-orange-600/20 active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            <span>Add expense</span>
            <ArrowDownCircle size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
