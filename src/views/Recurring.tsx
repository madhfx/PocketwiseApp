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
      {/* Header */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xs shadow-xs">
            <Clock size={18} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">Recurring</h1>
            <p className="text-xs text-slate-500 font-medium">Automated Accruals & Subscriptions</p>
          </div>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl flex items-center space-x-1.5 text-xs font-semibold transition-all active:scale-95 shadow-md shadow-indigo-500/20"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add Rule</span>
        </button>
      </header>

      {/* Projection Card */}
      {rules && rules.length > 0 && (
        <div className="modern-card rounded-2xl p-6 flex justify-between items-center">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Estimated Monthly Commitments
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              ₹{monthlyProjectedTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500">Accrued daily based on calendar days to protect cash flow</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
            <Clock size={22} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {rules && rules.length === 0 && (
        <div className="modern-card rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Clock size={22} />
          </div>
          <p className="text-slate-900 font-bold text-base mb-1">No recurring rules configured</p>
          <p className="text-slate-500 text-xs mb-6 max-w-sm leading-relaxed">
            Add recurring commitments like daily Swiggy, Netflix, or house rent to automatically forecast and protect your available spend balance.
          </p>
          <button 
            onClick={() => setShowForm(true)}
            className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 rounded-xl text-xs transition shadow-md shadow-indigo-500/25 active:scale-95"
          >
            Create First Recurring Rule
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
              className={`modern-card rounded-2xl p-5 transition-all ${
                isActive ? '' : 'opacity-60 bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3.5">
                  <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/80 shadow-xs">
                    <MerchantIcon name={rule.merchantName} size="md" className="rounded-lg" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-slate-900">{rule.merchantName}</h3>
                    <p className="text-[11px] text-slate-500">{rule.category}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-sm text-slate-900 block">
                    -₹{rule.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider capitalize">
                    {rule.frequency}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3.5 text-[11px]">
                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/60 font-medium">
                  Since {format(parseISO(rule.startDate), 'MMM d, yyyy')}
                </span>

                {rule.mode === 'forecast' ? (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg flex items-center space-x-1 font-semibold">
                    <ShieldCheck size={12} />
                    <span>Forecast Mode</span>
                  </span>
                ) : (
                  <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-lg flex items-center space-x-1 font-semibold">
                    <Zap size={12} />
                    <span>Auto-Record</span>
                  </span>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={() => toggleStatus(rule.id, rule.status)}
                  className={`h-8 flex items-center space-x-1.5 font-semibold px-3 rounded-lg transition text-xs active:scale-95 ${
                    isActive 
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  {isActive ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
                  <span>{isActive ? 'Pause Rule' : 'Resume Rule'}</span>
                </button>

                <button
                  onClick={() => handleDelete(rule.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition active:scale-90"
                  title="Delete rule"
                  aria-label="Delete rule"
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
