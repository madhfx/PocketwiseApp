import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format, isToday, isYesterday } from 'date-fns';
import { Trash2, Search, X, Repeat } from 'lucide-react';
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
    let dateLabel = format(d, 'EEEE, MMM d, yyyy');
    if (isToday(d)) dateLabel = 'Today';
    else if (isYesterday(d)) dateLabel = 'Yesterday';

    if (!grouped[dateLabel]) grouped[dateLabel] = [];
    grouped[dateLabel]!.push(t);
  });

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header */}
      <header className="flex justify-between items-center pt-1">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Activity</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {filtered ? `${filtered.length} transaction${filtered.length === 1 ? '' : 's'}` : 'Loading...'}
          </p>
        </div>
      </header>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search merchant, category, or note..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#121214] border border-neutral-800/90 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 text-neutral-500 hover:text-neutral-300 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
          {(['all', 'expense', 'income', 'recurring'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all shrink-0 ${
                filterType === type
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                  : 'bg-[#121214] text-neutral-400 border border-neutral-800/60 hover:text-neutral-200'
              }`}
            >
              {type === 'all' ? 'All Activity' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      {filtered && filtered.length === 0 ? (
        <div className="text-center p-12 bg-[#0a0a0a] rounded-3xl border border-neutral-900/80">
          <p className="text-neutral-400 font-medium text-sm">No transactions found</p>
          <p className="text-neutral-600 text-xs mt-1">Try clearing your search or add a new expense on the Overview screen.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(grouped).map(dateLabel => {
            const txs = grouped[dateLabel]!;
            const dayTotal = txs.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);

            return (
              <div key={dateLabel} className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    {dateLabel}
                  </h3>
                  <span className={`text-xs font-bold ${dayTotal <= 0 ? 'text-neutral-400' : 'text-emerald-400'}`}>
                    {dayTotal < 0 ? `-₹${Math.abs(dayTotal).toLocaleString('en-IN')}` : `+₹${dayTotal.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div className="bg-[#0a0a0a] rounded-3xl border border-neutral-900/90 divide-y divide-neutral-900 overflow-hidden shadow-sm">
                  {txs.map(tx => (
                    <div 
                      key={tx.id} 
                      className="p-3.5 flex items-center justify-between hover:bg-neutral-900/40 transition group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <MerchantIcon name={tx.merchantName} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <p className="font-semibold text-sm text-white truncate">
                              {tx.merchantName}
                            </p>
                            {tx.source === 'recurring' && (
                              <span className="p-0.5 rounded bg-orange-500/10 text-orange-400" title="Generated by recurring rule">
                                <Repeat size={11} />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-neutral-500 mt-0.5">
                            <span>{tx.category}</span>
                            {tx.note && (
                              <>
                                <span>•</span>
                                <span className="truncate text-neutral-400">{tx.note}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <span className={`font-bold text-sm block ${
                            tx.type === 'expense' ? 'text-white' : 'text-emerald-400'
                          }`}>
                            {tx.type === 'expense' ? `-₹${tx.amount.toLocaleString('en-IN')}` : `+₹${tx.amount.toLocaleString('en-IN')}`}
                          </span>
                          <span className="text-[10px] text-neutral-600 block">
                            {format(new Date(tx.date), 'h:mm a')}
                          </span>
                        </div>

                        <button 
                          onClick={(e) => handleDelete(tx.id, e)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete transaction"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
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
