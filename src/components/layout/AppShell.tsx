import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, List, PieChart, Repeat, Settings } from 'lucide-react';
import clsx from 'clsx';
import { TransactionForm } from '../forms/TransactionForm';

const navItems = [
  { to: '/', icon: Home, label: 'Overview' },
  { to: '/transactions', icon: List, label: 'Transactions' },
  { to: '/insights', icon: PieChart, label: 'Insights' },
  { to: '/recurring', icon: Repeat, label: 'Recurring' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-neutral-900 pb-safe md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-orange-500' : 'text-neutral-500 hover:text-neutral-300'
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
    <nav className="hidden md:flex flex-col w-64 bg-[#0a0a0a] border-r border-neutral-900 h-screen fixed top-0 left-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-neutral-100 flex items-center space-x-2">
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
                  ? 'bg-orange-500/10 text-orange-500'
                  : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'
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

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex">
      <SideNav />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 overflow-x-hidden relative">
        <div className="max-w-xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
};
