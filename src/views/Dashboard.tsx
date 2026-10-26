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

const COLORS = ['#FF9500', '#FFCC00', '#FF3B30']; // iOS system orange, yellow, red

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
  const spentPercentage = totalIncome > 0 ? Math.min(100, Math.round((totalSpent / totalIncome) * 100)) : 0;
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
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 glass-dock px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header & Dynamic Island Month Capsule */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-xs shadow-inner">
            <Wallet size={16} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              Pocketwise
            </h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">October Overview</p>
          </div>
        </div>

        {/* Month Selector Capsule */}
        <div className="glass-pill rounded-full p-1 flex items-center space-x-1 shadow-sm">
          <button 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-all active:scale-90"
            aria-label="Previous month"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-semibold text-white px-1 tracking-tight min-w-[74px] text-center">
            {format(currentDate, 'MMM yyyy')}
          </span>
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-all active:scale-90"
            aria-label="Next month"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </header>

      {/* Pillar 1 & 5: Clear Visual Hierarchy & Breathing Room Hero Widget */}
      <div className="glass-card rounded-[32px] p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">
              AVAILABLE TO SPEND
            </span>
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-400 mt-1 flex items-baseline">
              <span className="text-2xl md:text-3xl font-bold opacity-80 mr-1">₹</span>
              <span>{availableBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {totalIncome > 0 && (
            <div className="text-right">
              <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm">
                <span>{savingsRate}% saved</span>
              </span>
            </div>
          )}
        </div>

        {/* Spending Progress Line */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-medium">Month-to-Date Spent</span>
            <span className="font-bold text-white">₹{totalSpent.toLocaleString('en-IN')} <span className="text-zinc-500 font-normal">({spentPercentage}%)</span></span>
          </div>

          <div className="h-2.5 w-full bg-white/[0.06] rounded-full overflow-hidden p-0.5 border border-white/5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 shadow-sm"
              style={{ width: `${spentPercentage}%` }}
            />
          </div>
        </div>

        {/* Contextual Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/[0.08]">
          <div className="glass-card-subtle p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Take-Home Income</span>
            <span className="text-sm font-bold text-white block mt-0.5">
              ₹{totalIncome.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="glass-card-subtle p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Accrued Recurring</span>
            <span className="text-sm font-bold text-amber-400 block mt-0.5">
              ₹{accruedRecurring.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Pillar 2 & 3: Fast Expense Launcher (Finger-friendly 44px+ touch targets) */}
      <div className="glass-card rounded-[28px] p-5 space-y-3.5">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <span>Fast Expense Launcher</span>
            <Sparkles size={13} className="text-blue-400" />
          </h2>
          <span className="text-[11px] text-zinc-400">One-tap entry</span>
        </div>

        <div className="grid grid-cols-4 gap-3 pt-1">
          {FEATURED_APPS.map(appName => (
            <button
              key={appName}
              onClick={() => {
                setSelectedMerchantModal(appName);
                setMerchant(appName);
              }}
              className="flex flex-col items-center space-y-1.5 p-2 rounded-2xl hover:bg-white/[0.05] active:scale-90 transition-all duration-150 min-h-[64px]"
            >
              <div className="relative p-0.5 rounded-[18px] bg-gradient-to-b from-white/20 to-white/5 border border-white/15 shadow-md shadow-black/40">
                <MerchantIcon name={appName} size="lg" className="rounded-[16px]" />
              </div>
              <span className="text-[11px] font-medium text-zinc-300 truncate max-w-[64px] text-center">
                {appName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Top App Expenditures: Clean Scannable Hierarchy */}
      <div className="glass-card rounded-[28px] p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <TrendingUp size={13} className="text-orange-400" />
            <span>Top App Outflows</span>
          </h2>
          <span className="text-[11px] text-zinc-400">Ranked</span>
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
                      <div className="p-0.5 rounded-[14px] bg-white/10 border border-white/15 shadow-sm">
                        <MerchantIcon name={item.name} size="sm" className="rounded-[12px]" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">{item.name}</span>
                        <span className="text-[10px] text-zinc-400">{percentage}% of total expenses</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-white">₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Frosted Progress Bar */}
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

      {/* Pillar 4: Ergonomic Quick Entry Form in the Thumb Zone */}
      <div className="glass-card rounded-[28px] p-5 space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">
          Quick Expense Entry
        </h2>

        <form onSubmit={handleQuickAdd} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">AMOUNT (₹)</label>
            <div className="glass-card-subtle h-[50px] rounded-2xl flex items-center px-4 focus-within:border-blue-500/80 transition-all">
              <span className="text-zinc-500 font-bold text-base mr-2">₹</span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-transparent text-lg font-bold text-white placeholder-zinc-600 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category Chips with comfortable touch target */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2">CATEGORY</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_CATEGORIES.map(c => {
                const isSelected = category === c.label;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCategory(c.label)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-medium transition-all active:scale-95 flex items-center space-x-1.5 ${
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
              placeholder="Add note (optional)..."
              className="w-full h-11 glass-card-subtle rounded-2xl px-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-105 text-white font-semibold rounded-2xl text-xs shadow-lg shadow-indigo-500/25 border border-white/20 active:scale-95 transition-all duration-150 flex items-center justify-center space-x-2"
          >
            <span>Log Expense</span>
            <ArrowDown size={15} />
          </button>
        </form>
      </div>

      {/* Modal from Fast Launcher */}
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
