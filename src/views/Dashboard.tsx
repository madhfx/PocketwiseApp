import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { RecurringEngine } from '../services/recurringEngine';
import { format, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, Plus, ArrowUpRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MerchantIcon } from '../components/ui/MerchantIcon';
import { TransactionForm } from '../components/forms/TransactionForm';
import { MerchantFormModal } from '../components/forms/MerchantFormModal';
import { Link } from 'react-router-dom';

const PRESET_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Shopping', 'Transport', 'Subscriptions', 'Other'
];

const Dashboard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 10)); // October 2026 default
  const [selectedMerchantModal, setSelectedMerchantModal] = useState<string | null>(null);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
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

  // Dynamic Merchants from Database
  const allMerchants = useLiveQuery(() => db.merchants.toArray(), []);
  
  const featuredBrands = allMerchants?.filter(m => m.isFeatured && (m.type === 'merchant' || m.type === 'both')) || [];
  const displayBrands = featuredBrands.length > 0 
    ? featuredBrands 
    : (allMerchants?.filter(m => m.type !== 'client') || []).slice(0, 8);

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
    .slice(0, 4);

  // Quick Add State (Inline)
  const [quickAmount, setQuickAmount] = useState('');
  const [quickMerchant, setQuickMerchant] = useState('Swiggy');
  const [quickCategory, setQuickCategory] = useState('Food & Dining');

  // Update quick merchant default when merchants load
  useEffect(() => {
    if (displayBrands.length > 0 && !displayBrands.some(b => b.name === quickMerchant)) {
      setQuickMerchant(displayBrands[0].name);
    }
  }, [displayBrands]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount || isNaN(Number(quickAmount))) return;

    const num = Number(quickAmount);
    await db.transactions.add({
      id: uuidv4(),
      amount: num,
      merchantName: quickMerchant,
      category: quickCategory,
      date: currentDate.getTime(),
      type: 'expense',
      source: 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    setSuccessToast(`Logged ₹${num.toLocaleString('en-IN')} to ${quickMerchant}`);
    setQuickAmount('');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center space-x-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200 border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header: Brand + Month Switcher */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-slate-100 rounded-full px-3.5 py-1 mb-1.5">
            <span className="flex h-2 w-2 rounded-full bg-coral"></span>
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Smart Expense Tracker
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Monthly Overview
          </h1>
        </div>

        {/* Month Selector Pill */}
        <div className="bg-white border border-slate-200 rounded-full p-1.5 flex items-center space-x-1 shadow-sm self-start sm:self-auto">
          <button 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-full transition active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-slate-800 px-3 tracking-tight min-w-[84px] text-center">
            {format(currentDate, 'MMM yyyy')}
          </span>
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-full transition active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {/* Responsive Multi-column Grid (Mobile 1 column, Desktop 12 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Hero & Analytics Outflows) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. Dominant Available Balance Hero */}
          <section className="modern-card p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  AVAILABLE TO SPEND
                </span>
                <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 flex items-baseline">
                  <span className="text-2xl md:text-3xl font-bold text-slate-400 mr-1.5">₹</span>
                  <span>{availableBalance.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-slate-500 pt-0.5">
                  of ₹{totalIncome.toLocaleString('en-IN')} monthly income
                </p>
              </div>

              {totalIncome > 0 && (
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {savingsRate}% saved
                </span>
              )}
            </div>

            {/* High Contrast Progress Line */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Month-to-Date Outflow</span>
                <span className="font-semibold text-slate-900">
                  ₹{totalSpent.toLocaleString('en-IN')} <span className="text-slate-400 font-normal">({spentPercentage}%)</span>
                </span>
              </div>

              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 shadow-sm"
                  style={{ width: `${spentPercentage}%` }}
                />
              </div>
            </div>

            {/* Contextual Metric Cards */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div className="modern-card-subtle p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Actual Expenses</span>
                <span className="text-base font-bold text-slate-800 block mt-1">
                  ₹{actualExpenses.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="modern-card-subtle p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Accrued Recurring</span>
                <span className="text-base font-bold text-indigo-600 block mt-1">
                  ₹{accruedRecurring.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </section>

          {/* 2. Fast Launch Brand Grid: Dynamic from Database with Real Logos */}
          <section className="space-y-3.5">
            <div className="flex justify-between items-center px-1">
              <div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Quick Log by Brand
                </h2>
                <span className="text-[11px] text-slate-400">1-Tap Fast Launch</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAddBrandModal(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center space-x-1 transition active:scale-95"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Add Brand</span>
                </button>
                <span className="text-slate-300">•</span>
                <Link 
                  to="/merchants" 
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium transition"
                >
                  Manage
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {displayBrands.map(merchant => (
                <button
                  key={merchant.id}
                  onClick={() => {
                    setSelectedMerchantModal(merchant.name);
                  }}
                  className="modern-card p-3 rounded-2xl flex flex-col items-center space-y-2 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 min-h-[84px] justify-center group"
                >
                  <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/80 shadow-xs group-hover:scale-105 transition-transform">
                    <MerchantIcon 
                      name={merchant.name} 
                      domain={merchant.domain}
                      logoUrl={merchant.logoUrl}
                      size="sm" 
                      className="rounded-lg" 
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-700 truncate max-w-[66px] text-center">
                    {merchant.name}
                  </span>
                </button>
              ))}

              {/* Add New Brand Card in Grid */}
              <button
                onClick={() => setShowAddBrandModal(true)}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 p-3 rounded-2xl flex flex-col items-center justify-center space-y-1.5 hover:bg-slate-100/60 active:scale-95 transition-all min-h-[84px] group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <Plus size={14} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 group-hover:text-indigo-600">
                  New Brand
                </span>
              </button>
            </div>
          </section>

          {/* 3. Top Outflows: Ranked List with Clear Hierarchy */}
          <section className="space-y-3.5">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <TrendingUp size={14} className="text-indigo-600" />
                <span>Top Outflows</span>
              </h2>
              <Link to="/insights" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center space-x-0.5">
                <span>View Analytics</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            {topMerchants.length === 0 ? (
              <div className="modern-card p-8 text-center rounded-2xl">
                <p className="text-xs text-slate-400 font-medium">No expenses recorded yet for this month.</p>
              </div>
            ) : (
              <div className="modern-card rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {topMerchants.map((item, idx) => {
                  const percentage = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0;
                  return (
                    <div key={item.name} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition">
                      <div className="flex items-center space-x-3.5">
                        <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/80 shadow-xs">
                          <MerchantIcon name={item.name} size="md" className="rounded-lg" />
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-slate-900 block">{item.name}</span>
                          <span className="text-[11px] text-slate-500">{percentage}% of all expenses</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-slate-900 block">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          #{idx + 1} Outflow
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (Quick Entry Form & Financial Insights) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Quick Expense Entry Form in Thumb Zone */}
          <section className="modern-card p-6 md:p-7 space-y-5">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Quick Record
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Instant one-handed expense logger</p>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  AMOUNT (₹)
                </label>
                <div className="bg-slate-50 border border-slate-200 h-12 rounded-xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
                  <span className="text-slate-400 font-bold text-base mr-2">₹</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quickAmount}
                    onChange={e => setQuickAmount(e.target.value)}
                    className="w-full bg-transparent text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      VENDOR
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddBrandModal(true)}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold"
                    >
                      + New
                    </button>
                  </div>
                  <select
                    value={quickMerchant}
                    onChange={e => setQuickMerchant(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 font-medium focus:border-indigo-500 focus:outline-none"
                  >
                    {(allMerchants && allMerchants.length > 0) ? (
                      allMerchants.map(app => (
                        <option key={app.id} value={app.name} className="bg-white text-slate-800">{app.name}</option>
                      ))
                    ) : (
                      <option value="Swiggy">Swiggy</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    CATEGORY
                  </label>
                  <select
                    value={quickCategory}
                    onChange={e => setQuickCategory(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 font-medium focus:border-indigo-500 focus:outline-none"
                  >
                    {PRESET_CATEGORIES.map(c => (
                      <option key={c} value={c} className="bg-white text-slate-800">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 active:scale-95 transition shadow-lg shadow-indigo-500/25"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Record Expense</span>
              </button>
            </form>
          </section>

          {/* Cash Flow Summary Widget */}
          <section className="modern-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cash Flow Breakdown
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Base Salary / Income</span>
                <span className="font-bold text-slate-800">₹{totalIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Manual Expenses</span>
                <span className="font-bold text-slate-800">-₹{actualExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Accrued Subscriptions</span>
                <span className="font-bold text-indigo-600">-₹{accruedRecurring.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2 pt-3 font-semibold text-sm">
                <span className="text-slate-700">Net Balance Remaining</span>
                <span className="text-emerald-600 font-extrabold">₹{availableBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Transaction Modal when tapping Brand squircle */}
      {selectedMerchantModal && (
        <TransactionForm
          defaultMerchant={selectedMerchantModal}
          onClose={() => setSelectedMerchantModal(null)}
        />
      )}

      {/* Add New Brand Modal */}
      {showAddBrandModal && (
        <MerchantFormModal
          onClose={() => setShowAddBrandModal(false)}
          defaultType="merchant"
        />
      )}
    </div>
  );
};

export default Dashboard;
