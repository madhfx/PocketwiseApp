import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, BarChart3, Clock, SlidersHorizontal, Plus } from 'lucide-react';
import clsx from 'clsx';
import { TransactionForm } from '../forms/TransactionForm';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/transactions', icon: ReceiptText, label: 'Activity' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/recurring', icon: Clock, label: 'Recurring' },
  { to: '/settings', icon: SlidersHorizontal, label: 'Settings' },
];

export const IosGlassBottomBar: React.FC<{ onOpenAdd: () => void }> = ({ onOpenAdd }) => {
  return (
    <div className="fixed bottom-3 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] md:hidden pointer-events-none">
      <nav className="glass-dock max-w-sm mx-auto rounded-full px-2 py-1.5 flex items-center justify-between pointer-events-auto">
        {navItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-90',
                isActive
                  ? 'bg-white/15 text-white shadow-inner font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Center Floating iOS Action Button */}
        <button
          onClick={onOpenAdd}
          className="w-12 h-12 -my-2 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/25 active:scale-90 transition-transform"
          aria-label="Add transaction"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {navItems.slice(2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-90',
                isActive
                  ? 'bg-white/15 text-white shadow-inner font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export const IosDesktopSideNav: React.FC<{ onOpenAdd: () => void }> = ({ onOpenAdd }) => {
  return (
    <nav className="hidden md:flex flex-col w-64 glass-card border-r border-white/10 h-[calc(100vh-2rem)] fixed top-4 left-4 rounded-3xl z-40 select-none p-5 justify-between">
      <div>
        <div className="py-2 px-1 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-md">
            <div className="w-full h-full bg-black/80 rounded-[14px] flex items-center justify-center text-white text-lg">
              
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Pocketwise</h1>
            <p className="text-[11px] text-zinc-400 font-medium">iOS Liquid Glass</p>
          </div>
        </div>

        <div className="mt-8 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl transition font-medium text-xs',
                  isActive
                    ? 'bg-white/15 text-white border border-white/10 shadow-sm'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onOpenAdd}
          className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/25 border border-white/20 active:scale-95 transition"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Expense</span>
        </button>

        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 text-[11px] text-zinc-500">
          <p className="font-semibold text-zinc-400">Encrypted Local Storage</p>
          <p className="text-[10px] mt-0.5">Runs offline in Safari.</p>
        </div>
      </div>
    </nav>
  );
};

export const AppShell: React.FC = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <div className="min-h-screen bg-[#070709] text-white flex selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden">
      {/* Ambient iOS Colored Lighting Orbs (Visible through Frosted Glass) */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-[130px] pointer-events-none" />

      <IosDesktopSideNav onOpenAdd={() => setShowQuickAdd(true)} />

      <main className="flex-1 md:ml-72 pb-28 md:pb-10 relative z-10">
        <div className="max-w-md mx-auto p-4 md:p-6 min-h-screen">
          <Outlet />
        </div>
      </main>

      <IosGlassBottomBar onOpenAdd={() => setShowQuickAdd(true)} />

      {showQuickAdd && (
        <TransactionForm onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  );
};
