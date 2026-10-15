import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format } from 'date-fns';
import { Cloud, Download, Upload, ShieldAlert, CheckCircle2, Shield } from 'lucide-react';
import { GoogleDriveService } from '../services/googleDriveService';

const Settings: React.FC = () => {
  const currentMonthStr = format(new Date(2026, 9, 1), 'yyyy-MM'); // October 2026 default demo
  
  const income = useLiveQuery(
    () => db.monthlyIncomes.where('month').equals(currentMonthStr).first(),
    [currentMonthStr]
  );
  
  const settings = useLiveQuery(() => db.settings.get('default'));

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

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header */}
      <header className="pt-1">
        <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Preferences and local database controls</p>
      </header>

      {/* Monthly Salary Section */}
      <div className="bg-[#0a0a0a] p-5 rounded-3xl border border-neutral-900/90 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-white">Monthly Take-Home Salary</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Used to calculate available balance and savings rate</p>
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
              className="w-full bg-[#141416] border border-neutral-800 rounded-2xl pl-8 pr-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-orange-500 transition"
              placeholder="e.g. 125000"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold transition active:scale-95"
          >
            Update
          </button>
        </form>
      </div>

      {/* Google Drive Cloud Sync */}
      <div className="bg-[#0a0a0a] p-5 rounded-3xl border border-neutral-900/90 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Cloud size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Google Drive Backup</h2>
            <p className="text-xs text-neutral-500">Private encrypted cloud backup without intermediate servers</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
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
                className="w-full bg-[#141416] border border-neutral-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition"
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
              Last backed up: {format(new Date(settings.googleDriveSync.lastBackup), 'PPp')}
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
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-medium py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Upload size={14} />
              <span>{isSyncing ? 'Backing up...' : 'Backup to Drive'}</span>
            </button>

            <button
              onClick={handleDriveRestore}
              disabled={isSyncing}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-medium py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Download size={14} />
              <span>{isSyncing ? 'Restoring...' : 'Restore from Drive'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Offline JSON Export/Import */}
      <div className="bg-[#0a0a0a] p-5 rounded-3xl border border-neutral-900/90 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-white">Manual Export & Import</h2>
        <p className="text-xs text-neutral-500">Export your local database as a `.json` file to keep an offline snapshot.</p>
        
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={handleExport}
            className="flex-1 bg-[#141416] hover:bg-[#1a1a1e] border border-neutral-800 text-neutral-300 text-xs font-medium py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5"
          >
            <Download size={14} />
            <span>Download JSON</span>
          </button>

          <label className="flex-1 bg-[#141416] hover:bg-[#1a1a1e] border border-neutral-800 text-neutral-300 text-xs font-medium py-2.5 rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer">
            <Upload size={14} />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Security & Privacy Banner */}
      <div className="p-4 rounded-3xl bg-[#0d0d0f] border border-neutral-900 text-xs text-neutral-500 flex items-start space-x-3">
        <Shield size={18} className="text-orange-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-neutral-300">100% Client-Side Privacy</p>
          <p className="text-[11px] leading-relaxed">
            Pocketwise stores all data directly in your browser's IndexedDB. No external servers or analytics ever touch your financial records.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
