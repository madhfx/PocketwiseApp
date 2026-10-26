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
    <div className="fixed bottom-4 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] md:hidden pointer-events-none">
      <nav className="glass-dock max-w-sm mx-auto rounded-full p-1.5 flex items-center justify-between pointer-events-auto shadow-2xl">
        {navItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center h-12 w-14 rounded-full transition-all duration-150 active:scale-90',
                isActive
                  ? 'bg-white/15 text-white font-semibold shadow-inner'
                  : 'text-zinc-400 hover:text-zinc-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Center Floating iOS Action Button (48px Touch Target) */}
        <button
          onClick={onOpenAdd}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/25 active:scale-90 hover:brightness-110 transition-all duration-150"
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
                'flex flex-col items-center justify-center h-12 w-14 rounded-full transition-all duration-150 active:scale-90',
                isActive
                  ? 'bg-white/15 text-white font-semibold shadow-inner'
                  : 'text-zinc-400 hover:text-zinc-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
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
    <nav className="hidden md:flex flex-col w-64 glass-card h-[calc(100vh-2rem)] fixed top-4 left-4 rounded-[28px] z-40 select-none p-5 justify-between">
      <div>
        <div className="py-2 px-1 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-md">
            <div className="w-full h-full bg-black/80 rounded-[14px] flex items-center justify-center text-white text-lg">
              
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Pocketwise</h1>
            <p className="text-[11px] text-zinc-400 font-medium">Personal Finance PWA</p>
          </div>
        </div>

        <div className="mt-8 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition-all duration-150 font-medium text-xs active:scale-95',
                  isActive
                    ? 'bg-white/15 text-white border border-white/10 shadow-sm font-semibold'
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
          className="w-full h-12 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:brightness-105 text-white font-semibold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/25 border border-white/20 active:scale-95 transition-all duration-150"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>New Expense</span>
        </button>

        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/5 text-[11px] text-zinc-500">
          <p className="font-semibold text-zinc-400">100% Private & Local</p>
          <p className="text-[10px] mt-0.5 leading-relaxed">Financial records stored in browser IndexedDB.</p>
        </div>
      </div>
    </nav>
  );
};

export const AppShell: React.FC = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <div className="min-h-screen bg-[#060608] text-white flex selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden">
      {/* Ambient iOS Colored Lighting Orbs (Refracted through Frosted Glass) */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

      <IosDesktopSideNav onOpenAdd={() => setShowQuickAdd(true)} />

      <main className="flex-1 md:ml-72 pb-32 md:pb-12 relative z-10">
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
