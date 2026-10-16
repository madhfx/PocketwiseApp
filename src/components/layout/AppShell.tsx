import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Search, PlusSquare, PieChart, User } from 'lucide-react';
import clsx from 'clsx';
import { TransactionForm } from '../forms/TransactionForm';

export const InstagramBottomNav: React.FC<{ onOpenAdd: () => void }> = ({ onOpenAdd }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-neutral-900 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="flex justify-around items-center h-12 px-2">
        {/* Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            clsx(
              'flex items-center justify-center flex-1 h-full py-1 transition-transform active:scale-90',
              isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            )
          }
        >
          {({ isActive }) => (
            <Home size={24} strokeWidth={isActive ? 2.5 : 1.75} />
          )}
        </NavLink>

        {/* Transactions / Explore */}
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            clsx(
              'flex items-center justify-center flex-1 h-full py-1 transition-transform active:scale-90',
              isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            )
          }
        >
          {({ isActive }) => (
            <Search size={24} strokeWidth={isActive ? 2.8 : 2} />
          )}
        </NavLink>

        {/* Center Quick Add (+) */}
        <button
          onClick={onOpenAdd}
          className="flex items-center justify-center flex-1 h-full py-1 text-white hover:text-orange-400 transition-transform active:scale-90"
          aria-label="Add expense"
        >
          <div className="p-1 rounded-lg hover:bg-neutral-900 transition">
            <PlusSquare size={24} strokeWidth={2} />
          </div>
        </button>

        {/* Insights / Reels icon */}
        <NavLink
          to="/insights"
          className={({ isActive }) =>
            clsx(
              'flex items-center justify-center flex-1 h-full py-1 transition-transform active:scale-90',
              isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            )
          }
        >
          {({ isActive }) => (
            <PieChart size={23} strokeWidth={isActive ? 2.5 : 1.75} />
          )}
        </NavLink>

        {/* Profile / Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center justify-center flex-1 h-full py-1 transition-transform active:scale-90',
              isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            )
          }
        >
          {({ isActive }) => (
            <div className={clsx("p-0.5 rounded-full border transition", isActive ? "border-white" : "border-transparent")}>
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                <User size={13} />
              </div>
            </div>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export const InstagramSideNav: React.FC<{ onOpenAdd: () => void }> = ({ onOpenAdd }) => {
  return (
    <nav className="hidden md:flex flex-col w-64 bg-black border-r border-neutral-900 h-screen fixed top-0 left-0 z-40 select-none p-5 justify-between">
      <div>
        <div className="py-4 px-2">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 bg-clip-text text-transparent font-serif italic">Pocketwise</span>
          </h1>
        </div>

        <div className="space-y-2 mt-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-4 px-3 py-3 rounded-xl transition font-medium text-sm',
                isActive ? 'text-white font-bold bg-neutral-900' : 'text-neutral-400 hover:bg-neutral-950 hover:text-white'
              )
            }
          >
            <Home size={22} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-4 px-3 py-3 rounded-xl transition font-medium text-sm',
                isActive ? 'text-white font-bold bg-neutral-900' : 'text-neutral-400 hover:bg-neutral-950 hover:text-white'
              )
            }
          >
            <Search size={22} />
            <span>Search & Activity</span>
          </NavLink>

          <button
            onClick={onOpenAdd}
            className="w-full flex items-center space-x-4 px-3 py-3 rounded-xl transition font-medium text-sm text-neutral-400 hover:bg-neutral-950 hover:text-white text-left"
          >
            <PlusSquare size={22} />
            <span>Create Expense</span>
          </button>

          <NavLink
            to="/insights"
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-4 px-3 py-3 rounded-xl transition font-medium text-sm',
                isActive ? 'text-white font-bold bg-neutral-900' : 'text-neutral-400 hover:bg-neutral-950 hover:text-white'
              )
            }
          >
            <PieChart size={22} />
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/recurring"
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-4 px-3 py-3 rounded-xl transition font-medium text-sm',
                isActive ? 'text-white font-bold bg-neutral-900' : 'text-neutral-400 hover:bg-neutral-950 hover:text-white'
              )
            }
          >
            <div className="w-5 h-5 rounded-md border border-neutral-600 flex items-center justify-center text-[10px] font-bold">R</div>
            <span>Recurring Rules</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-4 px-3 py-3 rounded-xl transition font-medium text-sm',
                isActive ? 'text-white font-bold bg-neutral-900' : 'text-neutral-400 hover:bg-neutral-950 hover:text-white'
              )
            }
          >
            <User size={22} />
            <span>Profile & Settings</span>
          </NavLink>
        </div>
      </div>

      <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-2xl text-xs text-neutral-500">
        <p className="font-semibold text-neutral-300">Pocketwise Feed</p>
        <p className="text-[11px] text-neutral-600 mt-0.5">Mobile-first personal expense tracker.</p>
      </div>
    </nav>
  );
};

export const AppShell: React.FC = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex selection:bg-rose-500/30 selection:text-rose-200">
      <InstagramSideNav onOpenAdd={() => setShowQuickAdd(true)} />
      <main className="flex-1 md:ml-64 pb-16 md:pb-8 overflow-x-hidden relative">
        <div className="max-w-md mx-auto p-0 md:p-6 min-h-screen">
          <Outlet />
        </div>
      </main>
      <InstagramBottomNav onOpenAdd={() => setShowQuickAdd(true)} />

      {showQuickAdd && (
        <TransactionForm onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  );
};
