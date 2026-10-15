import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, List, PieChart, Repeat, Settings, Wallet } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Overview' },
  { to: '/transactions', icon: List, label: 'Activity' },
  { to: '/insights', icon: PieChart, label: 'Insights' },
  { to: '/recurring', icon: Repeat, label: 'Recurring' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl border-t border-neutral-900/80 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden transition-all">
      <div className="flex justify-around items-center h-14 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center flex-1 h-full py-1 rounded-2xl transition-all duration-200 relative group',
                isActive ? 'text-orange-500 scale-105' : 'text-neutral-500 hover:text-neutral-300'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className={clsx("text-[10px] mt-1 tracking-tight font-medium transition-colors", isActive ? "text-orange-400 font-semibold" : "text-neutral-500")}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export const SideNav: React.FC = () => {
  return (
    <nav className="hidden md:flex flex-col w-64 bg-black border-r border-neutral-900/80 h-screen fixed top-0 left-0 z-40 select-none">
      <div className="p-6 border-b border-neutral-900/60">
        <h1 className="text-xl font-bold text-white flex items-center space-x-3 tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-sm">
            <Wallet size={20} />
          </div>
          <span>Pocketwise</span>
        </h1>
        <p className="text-[11px] text-neutral-500 mt-1 pl-12 font-medium">Personal Finance PWA</p>
      </div>

      <div className="flex-1 px-3 space-y-1.5 mt-5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 font-medium text-sm',
                isActive
                  ? 'bg-neutral-900 text-orange-500 shadow-sm border border-neutral-800'
                  : 'text-neutral-400 hover:bg-neutral-950 hover:text-neutral-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={19} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-orange-500" : "text-neutral-500"} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 m-3 rounded-2xl bg-[#0a0a0a] border border-neutral-900 text-xs text-neutral-500">
        <p className="font-semibold text-neutral-400 mb-0.5">Local-First Storage</p>
        <p className="text-[11px] text-neutral-600">Your financial data stays securely on your device.</p>
      </div>
    </nav>
  );
};

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex selection:bg-orange-500/30 selection:text-orange-300">
      <SideNav />
      <main className="flex-1 md:ml-64 pb-24 md:pb-10 overflow-x-hidden relative">
        <div className="max-w-xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
};
