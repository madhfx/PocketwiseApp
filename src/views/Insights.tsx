import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { BarChart3, Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const COLORS = ['#FF9500', '#FFCC00', '#FF3B30', '#007AFF', '#AF52DE', '#30D158', '#5AC8FA', '#8E8E93'];

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
    <div className="space-y-6 font-sans">
      {/* iOS Header */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-xs">
            <BarChart3 size={15} className="text-blue-400" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">Analytics</h1>
        </div>
        <span className="text-xs text-zinc-400 font-medium glass-pill px-2.5 py-1 rounded-full">
          {format(currentDate, 'MMMM yyyy')}
        </span>
      </header>

      {totalExpense === 0 ? (
        <div className="text-center p-10 glass-card rounded-[28px]">
          <p className="text-zinc-400 text-xs">No expense data recorded for this month.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Category Donut Chart Widget */}
          <div className="glass-card p-6 rounded-[28px]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Spending by Category
            </h3>
            <div className="h-60 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={68}
                    outerRadius={88}
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
                    contentStyle={{ backgroundColor: 'rgba(20,20,24,0.85)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Total</span>
                <span className="font-extrabold text-xl text-white">₹{totalExpense.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-5 space-y-2.5">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-zinc-300 font-medium">{entry.name}</span>
                  </div>
                  <span className="font-bold text-white">₹{entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Merchants Widget */}
          <div className="glass-card p-6 rounded-[28px]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Merchant Distribution
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 35, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <RechartsTooltip
                    formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, 'Amount']}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(20,20,24,0.85)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
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

      {/* Category Budgets: Apple Health Rings Style */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Monthly Category Budgets
          </h2>
          <button 
            onClick={() => setShowBudgetForm(!showBudgetForm)}
            className="text-[11px] glass-pill hover:bg-white/15 text-white px-3 py-1 rounded-full transition active:scale-95 font-semibold flex items-center space-x-1"
          >
            <Plus size={12} />
            <span>{showBudgetForm ? 'Cancel' : 'Set Budget'}</span>
          </button>
        </div>

        {showBudgetForm && (
          <form onSubmit={handleSaveBudget} className="glass-card p-4 rounded-[26px] space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 mb-1">CATEGORY</label>
                <select
                  value={budgetCategory}
                  onChange={e => setBudgetCategory(e.target.value)}
                  className="w-full glass-card-subtle rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  {PRESET_CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 mb-1">LIMIT (₹)</label>
                <input
                  type="number"
                  required
                  value={budgetLimit}
                  onChange={e => setBudgetLimit(e.target.value)}
                  className="w-full glass-card-subtle rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  placeholder="e.g. 5000"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-xl transition shadow-md shadow-blue-500/25">
              Save Budget
            </button>
          </form>
        )}

        {(!budgets || budgets.length === 0) && !showBudgetForm && (
          <p className="text-xs text-zinc-500 italic px-2">No category spending limits set for this month.</p>
        )}

        <div className="space-y-3">
          {budgets?.map(budget => {
            const spent = categoryData[budget.category] || 0;
            const percentage = Math.min((spent / budget.limit) * 100, 100);
            
            let color = '#30D158'; // Apple green
            if (percentage >= 85) color = '#FF9500'; // Apple orange
            if (percentage >= 100) color = '#FF3B30'; // Apple red

            return (
              <div key={budget.id} className="glass-card p-4 rounded-[24px] relative group">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs text-white">{budget.category}</span>
                  <div className="text-xs">
                    <span className="text-white font-bold">₹{spent.toLocaleString()}</span>
                    <span className="text-zinc-400 text-[11px]"> / ₹{budget.limit.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Frosted Bar */}
                <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%`, backgroundColor: color }} 
                  />
                </div>

                <div className="flex justify-between items-center mt-2">
                  {percentage >= 100 ? (
                    <span className="text-[10px] text-rose-400 font-medium">Over budget by ₹{(spent - budget.limit).toLocaleString()}</span>
                  ) : (
                    <span className="text-[10px] text-zinc-400">₹{(budget.limit - spent).toLocaleString()} remaining</span>
                  )}

                  <button 
                    onClick={() => handleDeleteBudget(budget.id)}
                    className="text-zinc-500 hover:text-rose-400 text-xs p-1"
                    title="Remove"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Insights;
