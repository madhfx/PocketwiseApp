import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { BarChart3, Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const COLORS = ['#4F46E5', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'];

const PRESET_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Subscriptions',
  'Other'
];

const Insights: React.FC = () => {
  const [currentDate] = useState(new Date(2026, 9, 1));
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const currentMonthStr = format(currentDate, 'yyyy-MM');

  const transactions = useLiveQuery(
    () => db.transactions
      .where('date')
      .between(monthStart.getTime(), monthEnd.getTime() + 86400000)
      .toArray(),
    [monthStart.getTime(), monthEnd.getTime()]
  );

  const budgets = useLiveQuery(
    () => db.budgets.where('month').equals(currentMonthStr).toArray(),
    [currentMonthStr]
  );

  const expenses = (transactions || []).filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Category Aggregation
  const categoryData = expenses.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = 0;
    acc[t.category] += t.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(categoryData).map(name => ({
    name,
    value: categoryData[name]
  })).sort((a, b) => b.value - a.value);

  // Merchant Aggregation
  const merchantData = expenses.reduce((acc, t) => {
    if (!acc[t.merchantName]) acc[t.merchantName] = 0;
    acc[t.merchantName] += t.amount;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.keys(merchantData).map(name => ({
    name,
    amount: merchantData[name]
  })).sort((a, b) => b.amount - a.amount).slice(0, 5);

  // Budgets State
  const [budgetCategory, setBudgetCategory] = useState(PRESET_CATEGORIES[0]);
  const [budgetLimit, setBudgetLimit] = useState('');
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetLimit || isNaN(Number(budgetLimit))) return;

    const existing = budgets?.find(b => b.category === budgetCategory);
    if (existing) {
      await db.budgets.update(existing.id, { limit: Number(budgetLimit) });
    } else {
      await db.budgets.add({
        id: uuidv4(),
        month: currentMonthStr,
        category: budgetCategory,
        limit: Number(budgetLimit)
      });
    }
    setShowBudgetForm(false);
    setBudgetLimit('');
  };

  const handleDeleteBudget = async (id: string) => {
    await db.budgets.delete(id);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs shadow-xs">
            <BarChart3 size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">Analytics</h1>
            <p className="text-xs text-slate-500 font-medium">Spending Breakdown & Budget Limits</p>
          </div>
        </div>
        <span className="text-xs text-slate-700 font-semibold bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-xs">
          {format(currentDate, 'MMMM yyyy')}
        </span>
      </header>

      {totalExpense === 0 ? (
        <div className="text-center p-12 modern-card rounded-2xl">
          <p className="text-slate-500 text-xs font-medium">No expense data recorded for this month.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Category Donut Chart Widget */}
          <div className="modern-card p-6 md:p-8 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Spending by Category
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Proportional monthly expense distribution</p>
            </div>

            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={92}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Total</span>
                <span className="font-extrabold text-2xl text-slate-900">₹{totalExpense.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="space-y-2 pt-3 border-t border-slate-100">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex justify-between items-center py-1 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-700 font-medium">{entry.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">₹{entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Merchants Widget */}
          <div className="modern-card p-6 md:p-8 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Merchant Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Top 5 vendor spend rankings</p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 35, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
                  <RechartsTooltip
                    formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, 'Amount']}
                    cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                    {barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Category Budgets */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Category Budgets
            </h2>
            <p className="text-xs text-slate-400">Set spending thresholds and stay on track</p>
          </div>

          <button 
            onClick={() => setShowBudgetForm(!showBudgetForm)}
            className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl transition-all active:scale-95 font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-500/20"
          >
            <Plus size={14} />
            <span>{showBudgetForm ? 'Cancel' : 'Set Limit'}</span>
          </button>
        </div>

        {showBudgetForm && (
          <form onSubmit={handleSaveBudget} className="modern-card p-6 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">CATEGORY</label>
                <select
                  value={budgetCategory}
                  onChange={e => setBudgetCategory(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 font-medium focus:border-indigo-500 focus:outline-none"
                >
                  {PRESET_CATEGORIES.map(c => <option key={c} value={c} className="bg-white text-slate-800">{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">MONTHLY LIMIT (₹)</label>
                <input
                  type="number"
                  required
                  value={budgetLimit}
                  onChange={e => setBudgetLimit(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 font-bold focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. 5000"
                />
              </div>
            </div>

            <button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-500/25 active:scale-95">
              Save Budget Limit
            </button>
          </form>
        )}

        {(!budgets || budgets.length === 0) && !showBudgetForm && (
          <div className="modern-card p-8 text-center rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">No category spending limits set for this month.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets?.map(budget => {
            const spent = categoryData[budget.category] || 0;
            const percentage = Math.min((spent / budget.limit) * 100, 100);
            
            let color = '#10B981'; // Green
            if (percentage >= 85) color = '#F59E0B'; // Amber
            if (percentage >= 100) color = '#F43F5E'; // Coral red

            return (
              <div key={budget.id} className="modern-card p-5 rounded-2xl relative group space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-900">{budget.category}</span>
                  <div className="text-xs">
                    <span className="text-slate-900 font-bold">₹{spent.toLocaleString()}</span>
                    <span className="text-slate-400 font-normal"> / ₹{budget.limit.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                  <div 
                    className="h-full rounded-full transition-all duration-500 shadow-xs" 
                    style={{ width: `${percentage}%`, backgroundColor: color }} 
                  />
                </div>

                <div className="flex justify-between items-center pt-1">
                  {percentage >= 100 ? (
                    <span className="text-[11px] text-rose-500 font-semibold">Over budget by ₹{(spent - budget.limit).toLocaleString()}</span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium">₹{(budget.limit - spent).toLocaleString()} remaining</span>
                  )}

                  <button 
                    onClick={() => handleDeleteBudget(budget.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 transition"
                    title="Remove limit"
                    aria-label="Remove limit"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Insights;
