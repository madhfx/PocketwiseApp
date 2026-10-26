import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format, isToday, isYesterday } from 'date-fns';
import { Trash2, Search, X, Repeat, Receipt } from 'lucide-react';
import { MerchantIcon } from '../components/ui/MerchantIcon';

const Transactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'recurring'>('all');
  
  const transactions = useLiveQuery(async () => {
    const list = await db.transactions.toArray();
    return list.sort((a, b) => b.date - a.date);
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this transaction?')) {
      await db.transactions.delete(id);
    }
  };

  const filtered = transactions?.filter(t => {
    const matchesSearch = 
      t.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (!matchesSearch) return false;

    if (filterType === 'expense') return t.type === 'expense';
    if (filterType === 'income') return t.type === 'income';
    if (filterType === 'recurring') return t.source === 'recurring';
    return true;
  });

  // Group transactions by date
  const grouped: Record<string, typeof filtered> = {};
  filtered?.forEach(t => {
    const d = new Date(t.date);
    let dateLabel = format(d, 'EEEE, MMM d');
    if (isToday(d)) dateLabel = 'Today';
    else if (isYesterday(d)) dateLabel = 'Yesterday';

    if (!grouped[dateLabel]) grouped[dateLabel] = [];
    grouped[dateLabel]!.push(t);
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs shadow-xs">
            <Receipt size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">Activity</h1>
            <p className="text-xs text-slate-500 font-medium">Transaction History & Timeline</p>
          </div>
        </div>
        <span className="text-xs text-slate-600 font-semibold bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-xs">
          {filtered?.length || 0} entries
        </span>
      </header>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="bg-white border border-slate-200 h-12 rounded-xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-xs transition">
          <Search size={16} className="text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search merchants, categories, notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-700 p-1" aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-none text-xs font-medium pb-1">
          {(['all', 'expense', 'income', 'recurring'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`h-10 px-4 rounded-xl capitalize transition-all shrink-0 active:scale-95 ${
                filterType === type
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'all' ? 'All Activity' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      {filtered && filtered.length === 0 ? (
        <div className="modern-card rounded-2xl p-12 text-center space-y-2">
          <p className="text-slate-800 font-bold text-sm">No transactions found</p>
          <p className="text-slate-500 text-xs">Try clearing filters or record a new transaction.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(grouped).map(dateLabel => {
            const txs = grouped[dateLabel]!;
            const dayTotal = txs.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);

            return (
              <div key={dateLabel} className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {dateLabel}
                  </h3>
                  <span className={`text-xs font-bold ${dayTotal <= 0 ? 'text-slate-700' : 'text-emerald-600'}`}>
                    {dayTotal < 0 ? `-₹${Math.abs(dayTotal).toLocaleString('en-IN')}` : `+₹${dayTotal.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div className="modern-card rounded-2xl divide-y divide-slate-100 overflow-hidden">
                  {txs.map(tx => {
                    const isExpense = tx.type === 'expense';

                    return (
                      <div 
                        key={tx.id} 
                        className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition group"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/80 shadow-xs shrink-0">
                            <MerchantIcon name={tx.merchantName} size="md" className="rounded-lg" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <p className="font-semibold text-xs text-slate-900 truncate">
                                {tx.merchantName}
                              </p>
                              {tx.source === 'recurring' && (
                                <span className="p-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100" title="Recurring Accrual">
                                  <Repeat size={11} />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                              <span>{tx.category}</span>
                              {tx.note && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[130px] text-slate-600">{tx.note}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Time */}
                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="text-right">
                            <span className={`font-bold text-xs block ${isExpense ? 'text-slate-900' : 'text-emerald-600'}`}>
                              {isExpense ? `-₹${tx.amount.toLocaleString('en-IN')}` : `+₹${tx.amount.toLocaleString('en-IN')}`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {format(new Date(tx.date), 'h:mm a')}
                            </span>
                          </div>

                          <button 
                            onClick={(e) => handleDelete(tx.id, e)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition active:scale-90"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Transactions;
