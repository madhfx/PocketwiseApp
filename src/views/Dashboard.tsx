import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { RecurringEngine } from '../services/recurringEngine';
import { format, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths } from 'date-fns';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Plus, ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, Sparkles, ArrowDownCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MerchantIcon } from '../components/ui/MerchantIcon';
import { TransactionForm } from '../components/forms/TransactionForm';

const STORIES_MERCHANTS = [
  'Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'Amazon', 
  'Flipkart', 'Uber', 'Netflix', 'Spotify', 'Google Pay'
];

const PRESET_CATEGORIES = [
  { label: 'Food & groceries', icon: '🍔' },
  { label: 'Shopping', icon: '🛍️' },
  { label: 'Travel & transport', icon: '🚕' },
  { label: 'Subscriptions', icon: '🎬' },
  { label: 'Other', icon: '💳' }
];

const COLORS = ['#f97316', '#eab308', '#ec4899'];

const Dashboard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 10)); // October 2026 demo
  const [selectedStoryMerchant, setSelectedStoryMerchant] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
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

  // Quick Add State inside Feed
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('Swiggy');
  const [category, setCategory] = useState('Food & groceries');
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
    }, 3000);
  };

  return (
    <div className="font-sans pb-16 bg-black min-h-screen text-white">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 text-white border border-neutral-800 px-4 py-2 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-rose-500" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Instagram Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-neutral-900/80 px-4 py-2.5 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 bg-clip-text text-transparent font-serif italic">
          Pocketwise
        </h1>

        <div className="flex items-center space-x-2">
          {/* Month Switcher Pill */}
          <div className="flex items-center space-x-0.5 bg-[#121214] border border-neutral-800/80 rounded-full px-2 py-1">
            <button 
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-0.5 text-neutral-400 hover:text-white transition"
              aria-label="Previous month"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-[11px] font-semibold text-neutral-200 px-1.5 tracking-tight">
              {format(currentDate, 'MMM yyyy')}
            </span>
            <button 
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-0.5 text-neutral-400 hover:text-white transition"
              aria-label="Next month"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <button 
            onClick={() => setIsLiked(!isLiked)} 
            className="p-1 text-white hover:text-rose-500 transition"
          >
            <Heart size={22} className={isLiked ? "fill-rose-500 text-rose-500" : ""} />
          </button>
        </div>
      </header>

      {/* Instagram Stories Bar: Brand Icons with Gradient Rings! */}
      <div className="py-3 border-b border-neutral-900/80 overflow-x-auto scrollbar-none">
        <div className="flex space-x-3.5 px-4 items-center">
          {/* Your Story (+) */}
          <div 
            onClick={() => setSelectedStoryMerchant('Swiggy')}
            className="flex flex-col items-center space-y-1.5 cursor-pointer shrink-0"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white text-xs font-bold">
                <span className="text-xl">💰</span>
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center text-white">
                <Plus size={13} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">Quick Add</span>
          </div>

          {/* Brand Icons Stories */}
          {STORIES_MERCHANTS.map((brand) => (
            <div
              key={brand}
              onClick={() => {
                setSelectedStoryMerchant(brand);
                setMerchant(brand);
              }}
              className="flex flex-col items-center space-y-1.5 cursor-pointer shrink-0 group active:scale-95 transition"
            >
              {/* Instagram Gradient Ring */}
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-sm group-hover:brightness-110 transition">
                <div className="p-[2px] bg-black rounded-full">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-white">
                    <MerchantIcon name={brand} size="lg" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-neutral-300 font-medium truncate max-w-[62px] text-center">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FEED POST 1: Monthly Financial Summary */}
      <article className="border-b border-neutral-900/90 pb-3">
        {/* Post Header */}
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-xs">
                🏦
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-xs text-white">pocketwise.finance</span>
                <span className="text-blue-400 text-[11px]">✓</span>
              </div>
              <span className="text-[10px] text-neutral-400">
                {format(currentDate, 'MMMM yyyy')} • Official Ledger
              </span>
            </div>
          </div>
          <button className="text-neutral-400 hover:text-white">
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Post Media: Spending Hero Card */}
        <div className="mx-3 rounded-3xl bg-gradient-to-b from-[#16161a] to-[#0c0c0e] border border-neutral-800/80 p-6 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
              TOTAL MONTHLY SPENDING
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {savingsRate}% Saved
            </span>
          </div>

          <div className="text-4xl font-extrabold tracking-tight text-white mb-5">
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-800/80">
            <div className="bg-black/50 p-2.5 rounded-2xl border border-neutral-800/60">
              <span className="text-[10px] text-neutral-400 block">Available</span>
              <span className={`text-sm font-bold block mt-0.5 ${availableBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{availableBalance.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-black/50 p-2.5 rounded-2xl border border-neutral-800/60">
              <span className="text-[10px] text-neutral-400 block">Income</span>
              <span className="text-sm font-bold text-neutral-200 block mt-0.5">
                ₹{totalIncome.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-black/50 p-2.5 rounded-2xl border border-neutral-800/60">
              <span className="text-[10px] text-neutral-400 block">Accrued Rec.</span>
              <span className="text-sm font-bold text-orange-400 block mt-0.5">
                ₹{accruedRecurring.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Post Actions (Like, Comment, Share, Bookmark) */}
        <div className="flex justify-between items-center px-4 pt-3 pb-1">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsLiked(!isLiked)} className="active:scale-125 transition">
              <Heart size={23} className={isLiked ? "fill-rose-500 text-rose-500" : "text-white"} />
            </button>
            <button className="text-white hover:text-neutral-300">
              <MessageCircle size={23} />
            </button>
            <button className="text-white hover:text-neutral-300">
              <Send size={23} />
            </button>
          </div>
          <button onClick={() => setIsSaved(!isSaved)}>
            <Bookmark size={23} className={isSaved ? "fill-white text-white" : "text-white"} />
          </button>
        </div>

        {/* Post Captions & Engagement */}
        <div className="px-4 text-xs space-y-1">
          <p className="font-bold text-white">
            Liked by <span className="font-semibold text-neutral-200">swiggy_lover</span> and <span className="font-semibold text-neutral-200">others</span>
          </p>
          <p className="text-neutral-300 leading-snug">
            <span className="font-bold text-white mr-1.5">pocketwise.finance</span>
            Budget tracking for {format(currentDate, 'MMMM yyyy')}. Actual spending stands at ₹{actualExpenses.toLocaleString('en-IN')} with ₹{accruedRecurring.toLocaleString('en-IN')} in scheduled commitments.
          </p>
          <p className="text-[10px] text-neutral-500 uppercase mt-1">2 HOURS AGO</p>
        </div>
      </article>

      {/* FEED POST 2: Top Merchants Highlights Carousel */}
      <article className="border-b border-neutral-900/90 pb-4">
        {/* Post Header */}
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <TrendingUp size={16} className="text-orange-500" />
            </div>
            <div>
              <span className="font-bold text-xs text-white block">top_merchants_breakdown</span>
              <span className="text-[10px] text-neutral-400">Where Your Money Goes</span>
            </div>
          </div>
          <button className="text-neutral-400">
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Media: Top Merchants with Brand Logos */}
        <div className="mx-3 rounded-3xl bg-[#0e0e10] border border-neutral-800 p-4 space-y-4">
          {topMerchants.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-4">No transactions recorded yet this month.</p>
          ) : (
            topMerchants.map((item, idx) => {
              const percentage = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0;
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="p-[2px] rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600">
                        <div className="bg-black p-0.5 rounded-[10px]">
                          <MerchantIcon name={item.name} size="md" />
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">{item.name}</span>
                        <span className="text-[11px] text-neutral-400">{percentage}% of your total spending</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-white">₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-[#18181a] rounded-full overflow-hidden ml-11" style={{ width: 'calc(100% - 44px)' }}>
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
            })
          )}
        </div>

        <div className="px-4 pt-3 text-xs">
          <p className="font-bold text-white mb-0.5">Top Spending Insights</p>
          <p className="text-neutral-400 text-[11px]">Ranked by total actual spend recorded in {format(currentDate, 'MMMM yyyy')}.</p>
        </div>
      </article>

      {/* FEED POST 3: Quick Add Expense "Create Post" Card */}
      <article className="px-3 pt-3">
        <div className="rounded-3xl bg-[#0f0f12] border border-neutral-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-rose-500" />
            <h2 className="text-sm font-bold text-white">Quick Log Expense</h2>
          </div>

          <form onSubmit={handleQuickAdd} className="space-y-4">
            <div>
              <label className="block text-[11px] text-neutral-400 font-semibold mb-1">AMOUNT (₹)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-neutral-500 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#18181c] border border-neutral-800 rounded-2xl pl-8 pr-4 py-2.5 text-sm font-bold text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Merchant Grid with Logos */}
            <div>
              <label className="block text-[11px] text-neutral-400 font-semibold mb-2">MERCHANT / BRAND</label>
              <div className="grid grid-cols-3 gap-2">
                {STORIES_MERCHANTS.map(m => {
                  const isSelected = merchant === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMerchant(m)}
                      className={`p-2 rounded-xl border flex items-center space-x-2 text-xs font-semibold transition ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10 text-white shadow-sm ring-1 ring-rose-500/30'
                          : 'border-neutral-800/80 bg-[#16161a] text-neutral-400 hover:bg-[#1e1e24]'
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
              <label className="block text-[11px] text-neutral-400 font-semibold mb-2">CATEGORY</label>
              <div className="space-y-1.5">
                {PRESET_CATEGORIES.map(c => {
                  const isSelected = category === c.label;
                  return (
                    <div
                      key={c.label}
                      onClick={() => setCategory(c.label)}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition ${
                        isSelected 
                          ? 'bg-neutral-800/80 border-neutral-700 text-white' 
                          : 'bg-[#141418] border-neutral-800/50 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">{c.icon}</span>
                        <span className="text-xs font-medium">{c.label}</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-rose-500' : 'border-neutral-700'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Write a caption / note..."
                className="w-full bg-[#18181c] border border-neutral-800 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-semibold py-3 rounded-2xl transition shadow-lg text-sm active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <span>Share Expense</span>
              <ArrowDownCircle size={16} />
            </button>
          </form>
        </div>
      </article>

      {/* Quick Add from Story Click Modal */}
      {selectedStoryMerchant && (
        <TransactionForm
          defaultMerchant={selectedStoryMerchant}
          onClose={() => setSelectedStoryMerchant(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
