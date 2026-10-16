import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format } from 'date-fns';
import { Cloud, Download, Upload, ShieldAlert, CheckCircle2, Shield, Settings as SettingsIcon } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'cloud' | 'export'>('profile');

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

  return (
    <div className="font-sans pb-16 bg-black min-h-screen text-white">
      {/* Instagram Profile Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-neutral-900/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-base text-white tracking-tight">pocketwise.user</span>
          <span className="text-blue-400 text-xs">✓</span>
        </div>
        <button className="text-white hover:text-neutral-400">
          <SettingsIcon size={20} />
        </button>
      </header>

      {/* Profile Bio & Stats Row */}
      <div className="p-4 space-y-4 border-b border-neutral-900/80">
        <div className="flex items-center justify-between">
          {/* Avatar with Story Ring */}
          <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600">
            <div className="p-0.5 bg-black rounded-full">
              <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-900 flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex space-x-6 text-center pr-3">
            <div>
              <span className="font-bold text-sm text-white block">{totalTxCount || 0}</span>
              <span className="text-[11px] text-neutral-400">Transactions</span>
            </div>
            <div>
              <span className="font-bold text-sm text-white block">{totalRulesCount || 0}</span>
              <span className="text-[11px] text-neutral-400">Recurring</span>
            </div>
            <div>
              <span className="font-bold text-sm text-emerald-400 block">
                ₹{((income?.baseSalary || 0) / 1000).toFixed(0)}k
              </span>
              <span className="text-[11px] text-neutral-400">Income</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-white">Personal Expense Tracker</p>
          <p className="text-neutral-400">⚡ Client-side PWA with IndexedDB local encryption</p>
          <p className="text-neutral-500 text-[11px]">Designed for iPhone • Hosted on GitHub Pages</p>
        </div>

        {/* Tab Highlights */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
              activeTab === 'profile'
                ? 'bg-white text-black border-white'
                : 'bg-[#121214] text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            Edit Salary
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
              activeTab === 'cloud'
                ? 'bg-white text-black border-white'
                : 'bg-[#121214] text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            Google Drive
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
              activeTab === 'export'
                ? 'bg-white text-black border-white'
                : 'bg-[#121214] text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            Data Backup
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-4 space-y-4">
        {/* Tab 1: Edit Salary */}
        {activeTab === 'profile' && (
          <div className="bg-[#101012] p-5 rounded-3xl border border-neutral-800/80 space-y-4 shadow-sm animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Monthly Take-Home Salary</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Configured for {format(new Date(2026, 9, 1), 'MMMM yyyy')}</p>
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
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={e => setBaseSalary(e.target.value)}
                  className="w-full bg-[#18181c] border border-neutral-800 rounded-2xl pl-8 pr-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-rose-500 transition"
                  placeholder="e.g. 125000"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold transition active:scale-95"
              >
                Save
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Google Drive */}
        {activeTab === 'cloud' && (
          <div className="bg-[#101012] p-5 rounded-3xl border border-neutral-800/80 space-y-4 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-[1.5px]">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-white">
                  <Cloud size={14} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Google Drive Cloud Sync</h3>
                <p className="text-xs text-neutral-500">Private encrypted backup to personal Google Drive</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Google OAuth Client ID
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  placeholder="xxxx-xxxx.apps.googleusercontent.com"
                  className="w-full bg-[#18181c] border border-neutral-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition"
                />
                <button
                  type="button"
                  onClick={handleSaveClientId}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition shrink-0"
                >
                  Save
                </button>
              </div>
            </div>

            {settings?.googleDriveSync?.lastBackup && (
              <p className="text-[11px] text-neutral-500">
                Last backup: {format(new Date(settings.googleDriveSync.lastBackup), 'PPp')}
              </p>
            )}

            {syncStatus && (
              <div className={`p-3 rounded-2xl border text-xs flex items-center space-x-2 ${
                syncStatus.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {syncStatus.success ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                <span>{syncStatus.msg}</span>
              </div>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleDriveBackup}
                disabled={isSyncing}
                className="flex-1 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white text-xs font-semibold py-2.5 rounded-2xl transition disabled:opacity-50"
              >
                {isSyncing ? 'Backing up...' : 'Backup to Drive'}
              </button>

              <button
                onClick={handleDriveRestore}
                disabled={isSyncing}
                className="flex-1 bg-[#18181c] hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-semibold py-2.5 rounded-2xl transition disabled:opacity-50"
              >
                {isSyncing ? 'Restoring...' : 'Restore from Drive'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: JSON Export */}
        {activeTab === 'export' && (
          <div className="bg-[#101012] p-5 rounded-3xl border border-neutral-800/80 space-y-4 shadow-sm animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-white">Manual Export & Import</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Download your entire financial database as a `.json` snapshot for offline backups or transferring devices.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleExport}
                className="flex-1 bg-[#18181c] hover:bg-[#202026] border border-neutral-800 text-neutral-200 text-xs font-medium py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>

              <label className="flex-1 bg-[#18181c] hover:bg-[#202026] border border-neutral-800 text-neutral-200 text-xs font-medium py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer">
                <Upload size={14} />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {/* Privacy Note */}
        <div className="p-4 rounded-3xl bg-[#0c0c0e] border border-neutral-900 text-xs text-neutral-500 flex items-start space-x-3">
          <Shield size={17} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Your data never leaves your device without your explicit permission. All transactions are stored locally in IndexedDB.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
