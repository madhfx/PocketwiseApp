import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { RecurringEngine } from '../services/recurringEngine';
import { format, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, Sparkles, Wallet, ArrowDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MerchantIcon } from '../components/ui/MerchantIcon';
import { TransactionForm } from '../components/forms/TransactionForm';

const FEATURED_APPS = [
  'Swiggy', 'Zomato', 'Blinkit', 'Zepto', 
  'Amazon', 'Flipkart', 'Uber', 'Netflix'
];

const PRESET_CATEGORIES = [
  { label: 'Food & Dining', icon: '🍔' },
  { label: 'Shopping', icon: '🛍️' },
  { label: 'Transport', icon: '🚕' },
  { label: 'Subscriptions', icon: '🎬' },
  { label: 'Other', icon: '💳' }
];

const COLORS = ['#FF9500', '#FFCC00', '#FF3B30']; // Apple system orange, yellow, red

const Dashboard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 10)); // October 2026 demo
  const [selectedMerchantModal, setSelectedMerchantModal] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthKey = format(currentDate, 'yyyy-MM');

  // Database Queries
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

  // Merchant aggregation
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
  const [category, setCategory] = useState('Food & Dining');
  const [note, setNote] = useState('');

  const handleQuickAdd = async (e: React.FormEvent) => {
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

    setSuccessToast(`Logged ₹${numAmount.toLocaleString('en-IN')} to ${merchant}`);
    setAmount('');
    setNote('');

    setTimeout(() => {
      setSuccessToast(null);
    }, 2800);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 glass-dock px-4 py-2 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* iOS Floating Glass Header */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-xs shadow-inner">
            <Wallet size={15} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center space-x-1.5">
              <span>Pocketwise</span>
            </h1>
          </div>
        </div>

        {/* Dynamic Island Style Month Pill */}
        <div className="glass-pill rounded-full px-2 py-1 flex items-center space-x-1 shadow-sm">
          <button 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition active:scale-90"
            aria-label="Previous month"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-white px-1 tracking-tight min-w-[76px] text-center">
            {format(currentDate, 'MMM yyyy')}
          </span>
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition active:scale-90"
            aria-label="Next month"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </header>

      {/* iOS Hero Widget: Frosted Liquid Glass Card */}
      <div className="glass-card rounded-[32px] p-6 relative overflow-hidden transition-all duration-300">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
            {format(currentDate, 'MMMM')} Spending
          </span>
          {totalIncome > 0 && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm">
              {savingsRate}% saved
            </span>
          )}
        </div>

        {/* Big Display Amount */}
        <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-white my-3 flex items-baseline space-x-1">
          <span className="text-2xl md:text-3xl font-bold text-white/60">₹</span>
          <span>{totalSpent.toLocaleString('en-IN')}</span>
        </div>

        {/* Frosted Micro-cards Row */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
          <div className="glass-card-subtle p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-400 font-medium block">Remaining</span>
            <span className={`text-sm font-bold block mt-0.5 ${availableBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{availableBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="glass-card-subtle p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-400 font-medium block">Income</span>
            <span className="text-sm font-bold text-blue-400 block mt-0.5">
              ₹{totalIncome.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="glass-card-subtle p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-400 font-medium block">Accrued Rec.</span>
            <span className="text-sm font-bold text-amber-400 block mt-0.5">
              ₹{accruedRecurring.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Apple App Squircles Grid (Brand Icons Library) */}
      <div className="glass-card rounded-[28px] p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <span>Fast Expense Launcher</span>
            <Sparkles size={13} className="text-blue-400" />
          </h2>
          <span className="text-[11px] text-zinc-400">Tap to log</span>
        </div>

        <div className="grid grid-cols-4 gap-3 pt-1">
          {FEATURED_APPS.map(appName => (
            <button
              key={appName}
              onClick={() => {
                setSelectedMerchantModal(appName);
                setMerchant(appName);
              }}
              className="flex flex-col items-center space-y-1.5 group active:scale-90 transition-transform"
            >
              <div className="relative p-0.5 rounded-[18px] bg-gradient-to-b from-white/20 to-white/5 border border-white/15 shadow-md shadow-black/50 group-hover:brightness-110 transition">
                <MerchantIcon name={appName} size="lg" className="rounded-[16px]" />
              </div>
              <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white truncate max-w-[64px] text-center">
                {appName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Screen Time Style: "Where your money goes" */}
      <div className="glass-card rounded-[28px] p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <TrendingUp size={13} className="text-orange-400" />
            <span>Top App Expenditures</span>
          </h2>
          <span className="text-[11px] text-zinc-400">Monthly Ranking</span>
        </div>

        {topMerchants.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No expenses recorded for this month.</p>
        ) : (
          <div className="space-y-4">
            {topMerchants.map((item, idx) => {
              const percentage = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0;
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="p-0.5 rounded-[12px] bg-white/10 border border-white/15 shadow-sm">
                        <MerchantIcon name={item.name} size="sm" className="rounded-[10px]" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">{item.name}</span>
                        <span className="text-[10px] text-zinc-400">{percentage}% of all expenses</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-white">₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Frosted Glass Progress Bar */}
                  <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className="h-full rounded-full transition-all duration-500 shadow-sm"
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

      {/* iOS Control Center Style: Quick Add Expense */}
      <div className="glass-card rounded-[28px] p-5 space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">
          Quick Expense Entry
        </h2>

        <form onSubmit={handleQuickAdd} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">AMOUNT</label>
            <div className="glass-card-subtle rounded-2xl flex items-center px-4 py-2.5 focus-within:border-blue-500/80 transition">
              <span className="text-zinc-500 font-bold text-base mr-2">₹</span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-transparent text-base font-bold text-white placeholder-zinc-600 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Preset Category Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2">CATEGORY</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CATEGORIES.map(c => {
                const isSelected = category === c.label;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCategory(c.label)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-white/20'
                        : 'glass-card-subtle text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
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
              placeholder="Note (optional)..."
              className="w-full glass-card-subtle rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold py-3 rounded-2xl text-xs shadow-lg shadow-indigo-500/25 border border-white/20 active:scale-95 transition flex items-center justify-center space-x-2"
          >
            <span>Confirm Expense</span>
            <ArrowDown size={14} />
          </button>
        </form>
      </div>

      {/* Quick Add Modal from App Squircle tap */}
      {selectedMerchantModal && (
        <TransactionForm
          defaultMerchant={selectedMerchantModal}
          onClose={() => setSelectedMerchantModal(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
