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
      {/* iOS Header */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-xs shadow-inner">
            <Receipt size={16} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Activity</h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">Transaction Timeline</p>
          </div>
        </div>
        <span className="text-xs text-zinc-400 font-medium glass-pill px-3 py-1 rounded-full">
          {filtered?.length || 0} entries
        </span>
      </header>

      {/* Glass Search & Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar - 44px min touch target */}
        <div className="glass-card-subtle h-11 rounded-2xl flex items-center px-4 focus-within:border-white/25 transition-all">
          <Search size={16} className="text-zinc-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search merchants, notes, categories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-zinc-400 hover:text-white p-1">
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
              className={`h-9 px-4 rounded-xl capitalize transition-all shrink-0 active:scale-95 ${
                filterType === type
                  ? 'bg-white/20 text-white border border-white/20 shadow-sm font-semibold'
                  : 'glass-card-subtle text-zinc-400 hover:text-white'
              }`}
            >
              {type === 'all' ? 'All Activity' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      {filtered && filtered.length === 0 ? (
        <div className="glass-card rounded-[28px] p-10 text-center">
          <p className="text-zinc-300 font-semibold text-sm">No transactions found</p>
          <p className="text-zinc-500 text-xs mt-1">Try clearing filters or add a new transaction.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(grouped).map(dateLabel => {
            const txs = grouped[dateLabel]!;
            const dayTotal = txs.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);

            return (
              <div key={dateLabel} className="space-y-2.5">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    {dateLabel}
                  </h3>
                  <span className={`text-xs font-bold ${dayTotal <= 0 ? 'text-zinc-300' : 'text-emerald-400'}`}>
                    {dayTotal < 0 ? `-₹${Math.abs(dayTotal).toLocaleString('en-IN')}` : `+₹${dayTotal.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div className="glass-card rounded-[28px] divide-y divide-white/[0.06] overflow-hidden">
                  {txs.map(tx => {
                    const isExpense = tx.type === 'expense';

                    return (
                      <div 
                        key={tx.id} 
                        className="p-4 flex items-center justify-between hover:bg-white/[0.04] transition group"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className="p-0.5 rounded-[16px] bg-gradient-to-b from-white/15 to-white/5 border border-white/10 shadow-sm shrink-0">
                            <MerchantIcon name={tx.merchantName} size="md" className="rounded-[14px]" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <p className="font-semibold text-xs text-white truncate">
                                {tx.merchantName}
                              </p>
                              {tx.source === 'recurring' && (
                                <span className="p-0.5 rounded bg-blue-500/15 text-blue-400" title="Recurring">
                                  <Repeat size={10} />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-0.5">
                              <span>{tx.category}</span>
                              {tx.note && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[130px] text-zinc-300">{tx.note}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Time */}
                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="text-right">
                            <span className={`font-bold text-xs block ${isExpense ? 'text-white' : 'text-emerald-400'}`}>
                              {isExpense ? `-₹${tx.amount.toLocaleString('en-IN')}` : `+₹${tx.amount.toLocaleString('en-IN')}`}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              {format(new Date(tx.date), 'h:mm a')}
                            </span>
                          </div>

                          <button 
                            onClick={(e) => handleDelete(tx.id, e)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition active:scale-90"
                            title="Delete transaction"
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
