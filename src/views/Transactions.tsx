import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format } from 'date-fns';
import { Trash2, Search, Repeat } from 'lucide-react';
import { MerchantIcon } from '../components/ui/MerchantIcon';

const Transactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use Dexie live query to get all transactions, sorted by date descending
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray()
  );

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await db.transactions.delete(id);
    }
  };

  const filteredTransactions = (transactions || []).filter(tx => 
    tx.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group by date
  const grouped = filteredTransactions.reduce((acc, tx) => {
    const dateStr = format(new Date(tx.date), 'MMM d, yyyy');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {} as Record<string, typeof filteredTransactions>);

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
      </header>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search merchants, categories, or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-navy-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-mint-500 transition"
        />
      </div>

      {!transactions && (
        <div className="flex justify-center p-8 text-slate-400">Loading...</div>
      )}

      {transactions && filteredTransactions.length === 0 && (
        <div className="text-center p-12 bg-navy-800 rounded-2xl border border-slate-800">
          <p className="text-slate-400">No transactions found.</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-slate-400 mb-3 sticky top-0 bg-navy-900/90 backdrop-blur-sm py-2 z-10">
              {date}
            </h3>
            <div className="bg-navy-800 rounded-2xl border border-slate-800 divide-y divide-slate-800 overflow-hidden">
              {txs.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/50 transition group">
                  <div className="flex items-center space-x-4">
                    <MerchantIcon name={tx.merchantName} size="md" />
                    <div>
                      <p className="font-medium flex items-center">
                        {tx.merchantName}
                        {tx.source === 'recurring' && (
                          <span className="ml-2 bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded flex items-center">
                            <Repeat size={10} className="mr-1" /> Auto
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">{tx.category} {tx.note && `• ${tx.note}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`font-bold ${tx.type === 'expense' ? 'text-rose-400' : 'text-mint-400'}`}>
                      {tx.type === 'expense' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition opacity-0 group-hover:opacity-100 md:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Transactions;
