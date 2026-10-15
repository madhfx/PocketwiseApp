import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format, parseISO } from 'date-fns';
import { Plus, PauseCircle, PlayCircle, Trash2, CalendarClock, ShieldCheck, Zap } from 'lucide-react';
import { RecurringRuleForm } from '../components/forms/RecurringRuleForm';
import { MerchantIcon } from '../components/ui/MerchantIcon';

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
    if (confirm('Are you sure you want to delete this recurring rule?')) {
      await db.recurringRules.delete(id);
    }
  };

  const activeRules = rules?.filter(r => r.status === 'active') || [];
  const monthlyProjectedTotal = activeRules.reduce((sum, r) => {
    if (r.frequency === 'daily') return sum + (r.amount * 30);
    if (r.frequency === 'weekly') return sum + (r.amount * 4);
    return sum + r.amount;
  }, 0);

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header */}
      <header className="flex justify-between items-center pt-1">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Recurring</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {rules ? `${activeRules.length} active commitment${activeRules.length === 1 ? '' : 's'}` : 'Loading...'}
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-3.5 py-1.5 rounded-2xl transition shadow-md shadow-orange-600/20 text-xs font-semibold"
        >
          <Plus size={16} />
          <span>Add Rule</span>
        </button>
      </header>

      {/* Projection Card */}
      {rules && rules.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-[#141416] to-[#0d0d0f] p-5 border border-neutral-800/80 shadow-md flex justify-between items-center">
          <div>
            <span className="text-[11px] text-neutral-400 font-semibold tracking-wider uppercase block">
              Estimated Monthly Commitments
            </span>
            <span className="text-2xl font-bold text-white mt-1 block">
              ₹{monthlyProjectedTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-neutral-500">Deducted progressively based on real calendar days</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <CalendarClock size={20} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {rules && rules.length === 0 && (
        <div className="text-center p-12 bg-[#0a0a0a] rounded-3xl border border-neutral-900/90 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center text-neutral-500 mb-4 border border-neutral-800">
            <CalendarClock size={26} />
          </div>
          <p className="text-white font-semibold text-sm mb-1">No recurring rules configured</p>
          <p className="text-neutral-500 text-xs mb-6 max-w-xs">
            Add regular expenses like daily Swiggy, Netflix subscriptions, or house rent to automatically track progressive accruals.
          </p>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white font-medium px-5 py-2.5 rounded-2xl text-xs transition shadow-lg shadow-orange-600/20"
          >
            Create First Rule
          </button>
        </div>
      )}

      {/* Rules Grid */}
      <div className="space-y-3">
        {rules?.map(rule => {
          const isActive = rule.status === 'active';

          return (
            <div 
              key={rule.id} 
              className={`bg-[#0a0a0a] border rounded-3xl p-4.5 transition-all shadow-sm ${
                isActive ? 'border-neutral-800/90' : 'border-neutral-900/60 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <MerchantIcon name={rule.merchantName} size="md" />
                  <div>
                    <h3 className="font-semibold text-sm text-white tracking-tight">{rule.merchantName}</h3>
                    <p className="text-xs text-neutral-500">{rule.category}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-sm text-white block">
                    -₹{rule.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider capitalize">
                    {rule.frequency}
                  </span>
                </div>
              </div>

              {/* Tags & Metadata */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px]">
                <span className="bg-[#141416] text-neutral-400 border border-neutral-800/80 px-2 py-0.5 rounded-lg">
                  Since {format(parseISO(rule.startDate), 'MMM d, yyyy')}
                </span>

                {rule.mode === 'forecast' ? (
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                    <ShieldCheck size={11} />
                    <span>Forecast Only</span>
                  </span>
                ) : (
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                    <Zap size={11} />
                    <span>Auto-record</span>
                  </span>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-neutral-900 text-xs">
                <button
                  onClick={() => toggleStatus(rule.id, rule.status)}
                  className={`flex items-center space-x-1.5 font-medium px-2.5 py-1 rounded-xl transition ${
                    isActive 
                      ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20' 
                      : 'text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20'
                  }`}
                >
                  {isActive ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
                  <span>{isActive ? 'Pause' : 'Resume'}</span>
                </button>

                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-neutral-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                  title="Delete rule"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && <RecurringRuleForm onClose={() => setShowForm(false)} />}
    </div>
  );
};

export default Recurring;
