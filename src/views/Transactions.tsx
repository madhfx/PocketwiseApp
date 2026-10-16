import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format, isToday, isYesterday } from 'date-fns';
import { Trash2, Search, X, Repeat, Heart } from 'lucide-react';
import { MerchantIcon } from '../components/ui/MerchantIcon';

const Transactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'recurring'>('all');
  const [likedTxs, setLikedTxs] = useState<Record<string, boolean>>({});
  
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

  const toggleLike = (id: string) => {
    setLikedTxs(prev => ({ ...prev, [id]: !prev[id] }));
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
    <div className="font-sans pb-16 bg-black min-h-screen text-white">
      {/* Instagram Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-neutral-900/80 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span>Activity</span>
        </h1>
        <span className="text-xs text-neutral-500 font-semibold">
          {filtered?.length || 0} entries
        </span>
      </header>

      {/* Search Bar & Filters */}
      <div className="p-4 space-y-3 border-b border-neutral-900/80">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search brands, categories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#141416] border border-neutral-800 rounded-2xl pl-10 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 text-neutral-500 p-0.5">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-none text-xs font-semibold">
          {(['all', 'expense', 'income', 'recurring'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl capitalize transition shrink-0 ${
                filterType === type
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-[#161618] text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              {type === 'all' ? 'All Activity' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      {filtered && filtered.length === 0 ? (
        <div className="text-center p-12">
          <p className="text-neutral-400 font-bold text-sm">No activity found</p>
          <p className="text-neutral-600 text-xs mt-1">Transactions you record will appear in this feed.</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-900/60">
          {Object.keys(grouped).map(dateLabel => {
            const txs = grouped[dateLabel]!;

            return (
              <div key={dateLabel} className="pt-3">
                <div className="px-4 py-1.5">
                  <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    {dateLabel}
                  </h3>
                </div>

                <div className="divide-y divide-neutral-900/40">
                  {txs.map(tx => {
                    const isExpense = tx.type === 'expense';
                    const isLiked = likedTxs[tx.id];

                    return (
                      <div 
                        key={tx.id} 
                        className="px-4 py-3 flex items-center justify-between hover:bg-neutral-950 transition group"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Circular Brand Avatar with Story Ring */}
                          <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shrink-0">
                            <div className="p-0.5 bg-black rounded-full">
                              <MerchantIcon name={tx.merchantName} size="md" className="rounded-full" />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs text-neutral-300 leading-snug">
                              <span className="font-bold text-white mr-1.5">{tx.merchantName}</span>
                              {isExpense ? 'was debited' : 'credited income'}
                              <span className="text-neutral-500 ml-1.5 text-[11px]">
                                {format(new Date(tx.date), 'h:mm a')}
                              </span>
                            </p>

                            <div className="flex items-center space-x-2 text-[11px] text-neutral-500 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                                {tx.category}
                              </span>
                              {tx.note && <span className="truncate max-w-[120px]">{tx.note}</span>}
                              {tx.source === 'recurring' && (
                                <span className="text-orange-400 flex items-center space-x-0.5">
                                  <Repeat size={10} />
                                  <span>Recurring</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center space-x-2.5 shrink-0 ml-2">
                          <span className={`font-bold text-xs ${isExpense ? 'text-white' : 'text-emerald-400'}`}>
                            {isExpense ? `-₹${tx.amount.toLocaleString('en-IN')}` : `+₹${tx.amount.toLocaleString('en-IN')}`}
                          </span>

                          <button 
                            onClick={() => toggleLike(tx.id)}
                            className="p-1 active:scale-125 transition"
                          >
                            <Heart size={15} className={isLiked ? "fill-rose-500 text-rose-500" : "text-neutral-600 hover:text-white"} />
                          </button>

                          <button 
                            onClick={(e) => handleDelete(tx.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-600 hover:text-rose-400 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
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
