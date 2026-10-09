import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, List, PieChart, Repeat, Settings } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Overview' },
  { to: '/transactions', icon: List, label: 'Transactions' },
  { to: '/insights', icon: PieChart, label: 'Insights' },
  { to: '/recurring', icon: Repeat, label: 'Recurring' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy-800 border-t border-slate-800 pb-safe md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-mint-400' : 'text-slate-400 hover:text-slate-200'
              )
            }
          >
            <item.icon size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export const SideNav: React.FC = () => {
  return (
    <nav className="hidden md:flex flex-col w-64 bg-navy-800 border-r border-slate-800 h-screen fixed top-0 left-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <span className="bg-mint-500 p-1.5 rounded-lg text-navy-900">
            <Home size={20} />
          </span>
          <span>Pocketwise</span>
        </h1>
      </div>
      <div className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors',
                isActive
                  ? 'bg-mint-500/10 text-mint-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              )
            }
          >
            <item.icon size={20} strokeWidth={2.5} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
