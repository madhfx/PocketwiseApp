import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format } from 'date-fns';
import { Cloud, Download, Upload, ShieldAlert, CheckCircle2, Shield, SlidersHorizontal, User, RefreshCw } from 'lucide-react';
import { GoogleDriveService } from '../services/googleDriveService';

const Settings: React.FC = () => {
  const currentMonthStr = format(new Date(2026, 9, 1), 'yyyy-MM');
  
  const income = useLiveQuery(
    () => db.monthlyIncomes.where('month').equals(currentMonthStr).first(),
    [currentMonthStr]
  );
  
  const settings = useLiveQuery(() => db.settings.get('default'));
  const totalTxCount = useLiveQuery(() => db.transactions.count());
  const totalRulesCount = useLiveQuery(() => db.recurringRules.count());

  const [baseSalary, setBaseSalary] = useState('');
  const [clientId, setClientId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{success: boolean, msg: string} | null>(null);
  const [incomeSaved, setIncomeSaved] = useState(false);

  useEffect(() => {
    if (income) setBaseSalary(income.baseSalary.toString());
  }, [income]);

  useEffect(() => {
    if (settings?.googleDriveSync?.clientId) {
      setClientId(settings.googleDriveSync.clientId);
    }
  }, [settings]);

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseSalary) return;
    
    if (income?.id) {
      await db.monthlyIncomes.update(income.id, {
        baseSalary: Number(baseSalary)
      });
    } else {
      await db.monthlyIncomes.add({
        id: `income_${currentMonthStr}`,
        month: currentMonthStr,
        baseSalary: Number(baseSalary),
        additionalIncome: 0
      });
    }
    setIncomeSaved(true);
    setTimeout(() => setIncomeSaved(false), 2500);
  };

  const handleSaveClientId = async () => {
    const existing = await db.settings.get('default');
    if (existing) {
      await db.settings.update('default', {
        googleDriveSync: {
          ...existing.googleDriveSync,
          clientId
        }
      });
    } else {
      await db.settings.add({
        id: 'default',
        currency: 'INR',
        theme: 'system',
        defaultMonth: currentMonthStr,
        backupPreferences: {},
        googleDriveSync: { clientId }
      });
    }
    alert('Google OAuth Client ID saved.');
  };

  const handleExport = async () => {
    const data = {
      transactions: await db.transactions.toArray(),
      recurringRules: await db.recurringRules.toArray(),
      monthlyIncomes: await db.monthlyIncomes.toArray(),
      budgets: await db.budgets.toArray(),
      settings: await db.settings.toArray()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketwise_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions && Array.isArray(data.transactions)) {
          if (!confirm('This will MERGE imported data with your existing records. Continue?')) return;
          
          await db.transaction('rw', db.transactions, db.recurringRules, db.monthlyIncomes, db.budgets, async () => {
            if (data.transactions.length > 0) await db.transactions.bulkPut(data.transactions);
            if (data.recurringRules.length > 0) await db.recurringRules.bulkPut(data.recurringRules);
            if (data.monthlyIncomes.length > 0) await db.monthlyIncomes.bulkPut(data.monthlyIncomes);
            if (data.budgets?.length > 0) await db.budgets.bulkPut(data.budgets);
          });
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDriveBackup = async () => {
    if (!clientId) {
      alert("Please provide your Google OAuth Client ID first.");
      return;
    }
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const data = {
        transactions: await db.transactions.toArray(),
        recurringRules: await db.recurringRules.toArray(),
        monthlyIncomes: await db.monthlyIncomes.toArray(),
        budgets: await db.budgets.toArray(),
        settings: await db.settings.toArray()
      };
      
      const driveService = new GoogleDriveService(clientId);
      const success = await driveService.uploadBackup(JSON.stringify(data));
      
      if (success) {
        setSyncStatus({ success: true, msg: 'Backup uploaded to Google Drive successfully!' });
        const existing = await db.settings.get('default');
        if (existing) {
          await db.settings.update('default', {
            googleDriveSync: { ...existing.googleDriveSync, lastBackup: Date.now() }
          });
        }
      } else {
        setSyncStatus({ success: false, msg: 'Failed to upload backup to Google Drive.' });
      }
    } catch (e: any) {
      setSyncStatus({ success: false, msg: e.message || 'Error occurred.' });
    }
    setIsSyncing(false);
  };

  const handleDriveRestore = async () => {
    if (!clientId) {
      alert("Please configure your Google Client ID first.");
      return;
    }
    if (!confirm('This will MERGE downloaded data with your local data. Continue?')) {
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const driveService = new GoogleDriveService(clientId);
      const data = await driveService.downloadBackup();
      
      if (data && data.transactions) {
        await db.transaction('rw', db.transactions, db.recurringRules, db.monthlyIncomes, db.budgets, async () => {
          if (data.transactions.length > 0) await db.transactions.bulkPut(data.transactions);
          if (data.recurringRules.length > 0) await db.recurringRules.bulkPut(data.recurringRules);
          if (data.monthlyIncomes.length > 0) await db.monthlyIncomes.bulkPut(data.monthlyIncomes);
          if (data.budgets?.length > 0) await db.budgets.bulkPut(data.budgets);
        });
        setSyncStatus({ success: true, msg: 'Data restored successfully!' });
      } else {
        setSyncStatus({ success: false, msg: 'No valid backup found on Google Drive.' });
      }
    } catch (e: any) {
      setSyncStatus({ success: false, msg: e.message || 'Restore failed.' });
    }
    setIsSyncing(false);
  };

  const handleForceUpdate = async () => {
    setIsReloading(true);
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        await caches.delete(key);
      }
    }
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs shadow-xs">
            <SlidersHorizontal size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">Settings</h1>
            <p className="text-xs text-slate-500 font-medium">Preferences, Cloud Backup & Sync</p>
          </div>
        </div>
      </header>

      {/* Profile Header Card */}
      <div className="modern-card p-6 rounded-2xl flex items-center space-x-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
          <User size={26} />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Pocketwise User</h2>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {totalTxCount || 0} recorded transactions • {totalRulesCount || 0} active rules
          </p>
          <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            Encrypted Local PWA
          </span>
        </div>
      </div>

      {/* Grouped Section: Monthly Salary */}
      <section className="space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          FINANCIAL CONFIGURATION
        </span>

        <div className="modern-card p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Take-Home Salary</h3>
              <p className="text-xs text-slate-400 mt-0.5">Basis for available spend calculations and savings rate</p>
            </div>
            {incomeSaved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                <CheckCircle2 size={15} />
                <span>Saved</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveIncome} className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
              <input
                type="number"
                value={baseSalary}
                onChange={e => setBaseSalary(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none transition"
                placeholder="e.g. 125000"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-md shadow-indigo-500/25 shrink-0"
            >
              Update Salary
            </button>
          </form>
        </div>
      </section>

      {/* Grouped Section: Google Drive Cloud Sync */}
      <section className="space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          CLOUD SYNCHRONIZATION
        </span>

        <div className="modern-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Cloud size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Google Drive Backup</h3>
              <p className="text-xs text-slate-400">Direct client-to-cloud encrypted synchronization</p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
              GOOGLE OAUTH CLIENT ID
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="xxxx-xxxx.apps.googleusercontent.com"
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveClientId}
                className="h-11 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition shrink-0 active:scale-95 border border-slate-200"
              >
                Save
              </button>
            </div>
          </div>

          {settings?.googleDriveSync?.lastBackup && (
            <p className="text-xs text-slate-400">
              Last backup: {format(new Date(settings.googleDriveSync.lastBackup), 'PPp')}
            </p>
          )}

          {syncStatus && (
            <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2 font-medium ${
              syncStatus.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {syncStatus.success ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
              <span>{syncStatus.msg}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleDriveBackup}
              disabled={isSyncing}
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 active:scale-95 shadow-md shadow-indigo-500/25 flex items-center justify-center space-x-1.5"
            >
              <Upload size={14} />
              <span>{isSyncing ? 'Syncing...' : 'Backup to Drive'}</span>
            </button>

            <button
              onClick={handleDriveRestore}
              disabled={isSyncing}
              className="flex-1 h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition disabled:opacity-50 active:scale-95 shadow-xs flex items-center justify-center space-x-1.5"
            >
              <Download size={14} />
              <span>{isSyncing ? 'Restoring...' : 'Restore from Drive'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Grouped Section: Local Snapshot */}
      <section className="space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          DATA MANAGEMENT
        </span>

        <div className="modern-card p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Manual Export & Import</h3>
            <p className="text-xs text-slate-400 mt-0.5">Export a `.json` snapshot of your complete local database</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleExport}
              className="flex-1 h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>

            <label className="flex-1 h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95">
              <Upload size={14} />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </section>

      {/* PWA Update & Clear Cache */}
      <section className="space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          APPLICATION UPDATES
        </span>

        <div className="modern-card p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Version v2.0.0 (Modern UI)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Bypass service worker cache and reload latest design</p>
          </div>

          <button
            onClick={handleForceUpdate}
            disabled={isReloading}
            className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-2 active:scale-95 border border-slate-200 shadow-xs"
          >
            <RefreshCw size={14} className={isReloading ? 'animate-spin' : ''} />
            <span>{isReloading ? 'Reloading...' : 'Force Reload & Clear PWA Cache'}</span>
          </button>
        </div>
      </section>

      {/* Privacy Guarantee Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-500 flex items-start space-x-3.5">
        <Shield size={20} className="text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          Pocketwise is 100% private and client-side: your finances reside exclusively in your browser's IndexedDB and are never sent to any third-party analytics or external database.
        </p>
      </div>
    </div>
  );
};

export default Settings;
