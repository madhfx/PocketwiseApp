import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format, parseISO } from 'date-fns';
import { Plus, PauseCircle, PlayCircle, Trash2, CalendarClock } from 'lucide-react';
import { RecurringRuleForm } from '../components/forms/RecurringRuleForm';

const Recurring: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  const rules = useLiveQuery(async () => {
    const data = await db.recurringRules.toArray();
    return data.sort((a, b) => b.createdAt - a.createdAt);
  });

  const toggleStatus = async (id: string, currentStatus: string) => {
    await db.recurringRules.update(id, {
      status: currentStatus === 'active' ? 'paused' : 'active',
      updatedAt: Date.now()
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recurring rule? This will not delete previously generated transactions.')) {
      await db.recurringRules.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recurring</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-mint-400 px-4 py-2 rounded-xl transition"
        >
          <Plus size={18} />
          <span className="font-medium text-sm">Add Rule</span>
        </button>
      </header>

      {!rules && (
        <div className="flex justify-center p-8 text-slate-400">Loading...</div>
      )}

      {rules && rules.length === 0 && (
        <div className="text-center p-12 bg-navy-800 rounded-2xl border border-slate-800 flex flex-col items-center">
          <CalendarClock size={48} className="text-slate-600 mb-4" />
          <p className="text-slate-300 font-medium mb-1">No recurring rules yet</p>
          <p className="text-slate-500 text-sm mb-6 max-w-sm">
            Add your daily commute, monthly subscriptions, or rent to see how they impact your daily available balance.
          </p>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-mint-500 hover:bg-mint-400 text-navy-900 font-medium px-6 py-2.5 rounded-xl transition"
          >
            Create Rule
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules?.map(rule => (
          <div key={rule.id} className={`bg-navy-800 border ${rule.status === 'active' ? 'border-mint-500/30' : 'border-slate-800 opacity-60'} p-5 rounded-2xl relative transition-all`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-100">{rule.merchantName}</h3>
                <p className="text-sm text-slate-400">{rule.category}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-xl text-rose-400">-₹{rule.amount}</span>
                <p className="text-xs text-slate-400 mt-1 capitalize">{rule.frequency}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded">
                Starts: {format(parseISO(rule.startDate), 'MMM d, yyyy')}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${rule.mode === 'forecast' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {rule.mode === 'forecast' ? 'Forecast Only' : 'Auto-record'}
              </span>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                onClick={() => toggleStatus(rule.id, rule.status)}
                className={`flex items-center space-x-1.5 text-sm font-medium ${rule.status === 'active' ? 'text-amber-400 hover:text-amber-300' : 'text-mint-400 hover:text-mint-300'}`}
              >
                {rule.status === 'active' ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                <span>{rule.status === 'active' ? 'Pause' : 'Resume'}</span>
              </button>

              <button
                onClick={() => handleDelete(rule.id)}
                className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && <RecurringRuleForm onClose={() => setShowForm(false)} />}
    </div>
  );
};

export default Recurring;
