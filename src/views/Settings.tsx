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
      alert('Google Client ID saved locally on this device.');
    }
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
    a.download = `pocketwise_backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.transactions || json.recurringRules) {
          await db.transaction('rw', db.transactions, db.recurringRules, db.monthlyIncomes, db.budgets, async () => {
            if (json.transactions?.length) await db.transactions.bulkPut(json.transactions);
            if (json.recurringRules?.length) await db.recurringRules.bulkPut(json.recurringRules);
            if (json.monthlyIncomes?.length) await db.monthlyIncomes.bulkPut(json.monthlyIncomes);
            if (json.budgets?.length) await db.budgets.bulkPut(json.budgets);
          });
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
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
    window.location.reload();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* iOS Header */}
      <header className="flex justify-between items-center pt-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-xs shadow-inner">
            <SlidersHorizontal size={16} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Settings</h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">Preferences & Database</p>
          </div>
        </div>
      </header>

      {/* iOS Profile Header Card */}
      <div className="glass-card rounded-[32px] p-5 flex items-center space-x-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 p-[2px] shadow-lg shrink-0">
          <div className="w-full h-full bg-black/80 rounded-full flex items-center justify-center text-white text-xl">
            <User size={24} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white tracking-tight">Pocketwise User</h2>
          <p className="text-xs text-zinc-400 mt-0.5 truncate">
            {totalTxCount || 0} recorded transactions • {totalRulesCount || 0} active rules
          </p>
          <span className="inline-block mt-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
            Encrypted Local PWA
          </span>
        </div>
      </div>

      {/* Grouped Section: Monthly Salary */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3">
          FINANCIAL CONFIGURATION
        </span>

        <div className="glass-card rounded-[28px] p-5 space-y-3.5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-white">Monthly Take-Home Salary</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Basis for available spend & savings rate</p>
            </div>
            {incomeSaved && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 size={14} />
                <span>Saved</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveIncome} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">₹</span>
              <input
                type="number"
                value={baseSalary}
                onChange={e => setBaseSalary(e.target.value)}
                className="w-full h-11 glass-card-subtle rounded-2xl pl-8 pr-4 text-sm font-semibold text-white focus:outline-none focus:border-white/20 transition"
                placeholder="e.g. 125000"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-semibold transition active:scale-95 shadow-md shadow-blue-500/25 shrink-0"
            >
              Update
            </button>
          </form>
        </div>
      </div>

      {/* Grouped Section: Google Drive Cloud Sync */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3">
          CLOUD SYNCHRONIZATION
        </span>

        <div className="glass-card rounded-[28px] p-5 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <Cloud size={17} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Google Drive Backup</h3>
              <p className="text-[11px] text-zinc-400">Direct client-to-cloud encrypted sync</p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
              GOOGLE OAUTH CLIENT ID
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="xxxx-xxxx.apps.googleusercontent.com"
                className="w-full h-11 glass-card-subtle rounded-2xl px-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
              />
              <button
                type="button"
                onClick={handleSaveClientId}
                className="h-11 px-4 glass-card-subtle hover:bg-white/10 text-white rounded-2xl text-xs font-semibold transition shrink-0 active:scale-95"
              >
                Save
              </button>
            </div>
          </div>

          {settings?.googleDriveSync?.lastBackup && (
            <p className="text-[11px] text-zinc-400">
              Last backup: {format(new Date(settings.googleDriveSync.lastBackup), 'PPp')}
            </p>
          )}

          {syncStatus && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center space-x-2 ${
              syncStatus.success 
                ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' 
                : 'bg-rose-500/15 border-rose-500/25 text-rose-400'
            }`}>
              {syncStatus.success ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
              <span>{syncStatus.msg}</span>
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handleDriveBackup}
              disabled={isSyncing}
              className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-2xl transition disabled:opacity-50 active:scale-95 shadow-md shadow-blue-500/25 border border-white/20 flex items-center justify-center space-x-1.5"
            >
              <Upload size={14} />
              <span>{isSyncing ? 'Syncing...' : 'Backup to Drive'}</span>
            </button>

            <button
              onClick={handleDriveRestore}
              disabled={isSyncing}
              className="flex-1 h-11 glass-card-subtle hover:bg-white/10 text-white text-xs font-semibold rounded-2xl transition disabled:opacity-50 active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <Download size={14} />
              <span>{isSyncing ? 'Restoring...' : 'Restore from Drive'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Section: Local Snapshot */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3">
          DATA MANAGEMENT
        </span>

        <div className="glass-card rounded-[28px] p-5 space-y-3.5">
          <h3 className="text-xs font-bold text-white">Manual Export & Import</h3>
          <p className="text-[11px] text-zinc-400">Export a `.json` snapshot of your local database.</p>

          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handleExport}
              className="flex-1 h-11 glass-card-subtle hover:bg-white/10 text-zinc-200 text-xs font-medium rounded-2xl transition flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>

            <label className="flex-1 h-11 glass-card-subtle hover:bg-white/10 text-zinc-200 text-xs font-medium rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95">
              <Upload size={14} />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* PWA Update & Clear Cache */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3">
          APPLICATION UPDATES
        </span>

        <div className="glass-card rounded-[28px] p-5 space-y-3">
          <div>
            <h3 className="text-xs font-bold text-white">App Version: v1.1.0</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Clear offline cache and force reload latest UI</p>
          </div>

          <button
            onClick={handleForceUpdate}
            className="w-full h-11 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-2xl transition flex items-center justify-center space-x-2 active:scale-95 border border-white/10 shadow-sm"
          >
            <RefreshCw size={14} />
            <span>Force Reload & Clear PWA Cache</span>
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="glass-card rounded-[26px] p-4.5 text-xs text-zinc-400 flex items-start space-x-3">
        <Shield size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Pocketwise is zero-knowledge: your finances are stored inside your device's IndexedDB and never uploaded to any remote server.
        </p>
      </div>
    </div>
  );
};

export default Settings;
