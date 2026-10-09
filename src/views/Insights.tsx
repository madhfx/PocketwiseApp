import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { v4 as uuidv4 } from 'uuid';

const COLORS = ['#f97316', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#06b6d4', '#64748b'];

const PRESET_CATEGORIES = [
  'Food & groceries',
  'Shopping',
  'Travel & transport',
  'Subscriptions',
  'Other'
];

const Insights: React.FC = () => {
  const [currentDate] = useState(new Date());
  
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
    <div className="space-y-8 font-sans pb-10">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">Insights</h1>
        <p className="text-neutral-500 text-xs mt-1 uppercase tracking-wider">{format(currentDate, 'MMMM yyyy')}</p>
      </header>

      {totalExpense === 0 ? (
        <div className="text-center p-12 bg-[#0a0a0a] rounded-2xl border border-neutral-900">
          <p className="text-neutral-500 text-sm">Not enough data for this month.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Pie Chart */}
          <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-900">
            <h3 className="text-sm font-bold text-white mb-4">Spending by Category</h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#111', borderColor: '#262626', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-neutral-500 uppercase tracking-wider">Total</span>
                <span className="font-bold text-xl text-white">₹{totalExpense.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-neutral-300">{entry.name}</span>
                  </div>
                  <span className="font-bold text-white">₹{entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Merchants Bar Chart */}
          <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-900">
            <h3 className="text-sm font-bold text-white mb-4">Top Merchants</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
                  <RechartsTooltip
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                    cursor={{ fill: '#171717' }}
                    contentStyle={{ backgroundColor: '#111', borderColor: '#262626', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="amount" fill="#f97316" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <hr className="border-t border-neutral-900 my-8" />

      {/* Category Budgets */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-white">Monthly Budgets</h2>
          <button 
            onClick={() => setShowBudgetForm(!showBudgetForm)}
            className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-full transition"
          >
            {showBudgetForm ? 'Cancel' : 'Set Budget'}
          </button>
        </div>

        {showBudgetForm && (
          <form onSubmit={handleSaveBudget} className="bg-[#0a0a0a] p-4 rounded-2xl border border-neutral-900 mb-6 flex flex-col md:flex-row gap-3 items-end">
            <div className="w-full md:w-1/3">
              <label className="block text-xs text-neutral-500 mb-2">Category</label>
              <select
                value={budgetCategory}
                onChange={e => setBudgetCategory(e.target.value)}
                className="w-full bg-[#111] border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600 appearance-none"
              >
                {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-xs text-neutral-500 mb-2">Limit (₹)</label>
              <input
                type="number"
                required
                value={budgetLimit}
                onChange={e => setBudgetLimit(e.target.value)}
                className="w-full bg-[#111] border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                placeholder="e.g. 5000"
              />
            </div>
            <button type="submit" className="w-full md:w-auto bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium py-2 px-6 rounded-lg transition">
              Save
            </button>
          </form>
        )}

        {(!budgets || budgets.length === 0) && !showBudgetForm && (
          <p className="text-xs text-neutral-600 italic">No budgets set for this month. Setting budgets helps you track spending limits per category.</p>
        )}

        <div className="space-y-4">
          {budgets?.map(budget => {
            const spent = categoryData[budget.category] || 0;
            const percentage = Math.min((spent / budget.limit) * 100, 100);
            
            let colorClass = 'bg-green-500';
            if (percentage >= 85) colorClass = 'bg-orange-500';
            if (percentage >= 100) colorClass = 'bg-red-500';

            return (
              <div key={budget.id} className="bg-[#0a0a0a] p-4 rounded-xl border border-neutral-900 relative group">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm text-white">{budget.category}</span>
                  <div className="text-xs">
                    <span className="text-white font-bold">₹{spent.toLocaleString()}</span>
                    <span className="text-neutral-500"> / ₹{budget.limit.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="h-1.5 w-full bg-[#171717] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${colorClass}`} 
                    style={{ width: `${percentage}%` }} 
                  />
                </div>

                {percentage >= 100 ? (
                  <p className="text-[10px] text-red-500 mt-2 font-medium">Over budget by ₹{(spent - budget.limit).toLocaleString()}</p>
                ) : (
                  <p className="text-[10px] text-neutral-500 mt-2">₹{(budget.limit - spent).toLocaleString()} remaining</p>
                )}

                <button 
                  onClick={() => handleDeleteBudget(budget.id)}
                  className="absolute top-3 right-3 text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  title="Remove budget"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Insights;
