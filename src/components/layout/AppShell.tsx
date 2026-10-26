import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, BarChart3, Clock, SlidersHorizontal, Plus, Building2 } from 'lucide-react';
import clsx from 'clsx';
import { TransactionForm } from '../forms/TransactionForm';

const mobileNavItemsLeft = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/transactions', icon: ReceiptText, label: 'Activity' },
];

const mobileNavItemsRight = [
  { to: '/recurring', icon: Clock, label: 'Recurring' },
  { to: '/settings', icon: SlidersHorizontal, label: 'Settings' },
];

const desktopNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/transactions', icon: ReceiptText, label: 'Activity' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/recurring', icon: Clock, label: 'Recurring' },
  { to: '/merchants', icon: Building2, label: 'Brands & Clients' },
  { to: '/settings', icon: SlidersHorizontal, label: 'Settings' },
];

export const ModernBottomBar: React.FC<{ onOpenAdd: () => void }> = ({ onOpenAdd }) => {
  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] md:hidden pointer-events-none">
      <nav className="modern-dock max-w-sm mx-auto rounded-full p-1.5 flex items-center justify-between pointer-events-auto">
        {mobileNavItemsLeft.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center h-12 w-14 rounded-full transition-all duration-150 active:scale-95',
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Center Primary Action CTA */}
        <button
          onClick={onOpenAdd}
          className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-90 transition-all duration-150"
          aria-label="Add transaction"
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>

        {mobileNavItemsRight.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center h-12 w-14 rounded-full transition-all duration-150 active:scale-95',
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export const ModernSideNav: React.FC<{ onOpenAdd: () => void }> = ({ onOpenAdd }) => {
  return (
    <nav className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 h-screen fixed top-0 left-0 z-40 select-none p-6 justify-between">
      <div className="space-y-8">
        <div className="px-1 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25">
            PW
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-800">Pocketwise</h1>
            <p className="text-[11px] text-slate-500 font-medium">Expense Tracker</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center space-x-3.5 px-3.5 py-3 rounded-xl transition-all duration-150 font-medium text-xs active:scale-98',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100/80 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <item.icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-slate-200">
        <button
          onClick={onOpenAdd}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 active:scale-95 transition-all duration-150 shadow-md shadow-indigo-500/25"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Expense</span>
        </button>

        <div className="px-1 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700">Local-First Storage</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Encrypted in browser IndexedDB.</p>
        </div>
      </div>
    </nav>
  );
};

export const AppShell: React.FC = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex selection:bg-indigo-600 selection:text-white relative">
      <ModernSideNav onOpenAdd={() => setShowQuickAdd(true)} />

      <main className="flex-1 md:ml-64 pb-32 md:pb-12">
        <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-screen">
          <Outlet />
        </div>
      </main>

      <ModernBottomBar onOpenAdd={() => setShowQuickAdd(true)} />

      {showQuickAdd && (
        <TransactionForm onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  );
};
