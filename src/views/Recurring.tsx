import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format, parseISO } from 'date-fns';
import { Plus, PauseCircle, PlayCircle, Trash2, Clock, ShieldCheck, Zap } from 'lucide-react';
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
    if (confirm('Delete this recurring rule?')) {
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
    <div className="space-y-6 font-sans">
      {/* iOS Header */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-xs shadow-inner">
            <Clock size={16} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Recurring</h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">Commitment Manager</p>
          </div>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          className="h-9 glass-pill hover:bg-white/15 px-3.5 rounded-full flex items-center space-x-1.5 text-xs font-semibold text-white transition-all active:scale-95 shadow-sm"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add Rule</span>
        </button>
      </header>

      {/* Projection Glass Card */}
      {rules && rules.length > 0 && (
        <div className="glass-card rounded-[32px] p-6 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Estimated Monthly Commitments
            </span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              ₹{monthlyProjectedTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-zinc-400">Accrued daily based on calendar days</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
            <Clock size={22} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {rules && rules.length === 0 && (
        <div className="glass-card rounded-[28px] p-10 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl glass-pill flex items-center justify-center text-zinc-400 mb-3">
            <Clock size={22} />
          </div>
          <p className="text-white font-semibold text-sm mb-1">No recurring rules</p>
          <p className="text-zinc-400 text-xs mb-5 max-w-xs leading-relaxed">
            Add recurring commitments like daily Swiggy, Netflix, or house rent to automatically forecast available balances.
          </p>
          <button 
            onClick={() => setShowForm(true)}
            className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 rounded-2xl text-xs transition shadow-md shadow-blue-500/25 active:scale-95"
          >
            Create First Rule
          </button>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3.5">
        {rules?.map(rule => {
          const isActive = rule.status === 'active';

          return (
            <div 
              key={rule.id} 
              className={`glass-card rounded-[28px] p-5 transition-all ${
                isActive ? '' : 'opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-0.5 rounded-[16px] bg-gradient-to-b from-white/15 to-white/5 border border-white/10 shadow-sm">
                    <MerchantIcon name={rule.merchantName} size="md" className="rounded-[14px]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-white">{rule.merchantName}</h3>
                    <p className="text-[11px] text-zinc-400">{rule.category}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-xs text-white block">
                    -₹{rule.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider capitalize">
                    {rule.frequency}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3.5 text-[10px]">
                <span className="glass-card-subtle text-zinc-300 px-2.5 py-1 rounded-lg">
                  Since {format(parseISO(rule.startDate), 'MMM d, yyyy')}
                </span>

                {rule.mode === 'forecast' ? (
                  <span className="bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg flex items-center space-x-1 font-medium">
                    <ShieldCheck size={11} />
                    <span>Forecast Mode</span>
                  </span>
                ) : (
                  <span className="bg-purple-500/15 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-lg flex items-center space-x-1 font-medium">
                    <Zap size={11} />
                    <span>Auto-Record</span>
                  </span>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-white/[0.06] text-xs">
                <button
                  onClick={() => toggleStatus(rule.id, rule.status)}
                  className={`h-8 flex items-center space-x-1.5 font-semibold px-3 rounded-xl transition text-xs active:scale-95 ${
                    isActive 
                      ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20' 
                      : 'text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20'
                  }`}
                >
                  {isActive ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
                  <span>{isActive ? 'Pause Rule' : 'Resume Rule'}</span>
                </button>

                <button
                  onClick={() => handleDelete(rule.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition active:scale-90"
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
