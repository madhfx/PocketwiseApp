import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { format } from 'date-fns';
import { Cloud, CloudOff, Download, Upload, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { GoogleDriveService } from '../services/googleDriveService';

const Settings: React.FC = () => {
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  
  const income = useLiveQuery(
    () => db.monthlyIncomes.where('month').equals(currentMonthStr).first(),
    [currentMonthStr]
  );
  
  const settings = useLiveQuery(() => db.settings.get('default'));

  const [baseSalary, setBaseSalary] = useState('');
  const [clientId, setClientId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{success: boolean, msg: string} | null>(null);
  
  useEffect(() => {
    if (income) setBaseSalary(income.baseSalary.toString());
  }, [income]);

  useEffect(() => {
    if (settings?.googleDriveSync?.clientId) {
      setClientId(settings.googleDriveSync.clientId);
    }
  }, [settings]);

  const handleSaveIncome = async () => {
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
    alert('Income updated successfully!');
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
      alert('Google Client ID saved locally.');
    }
  };

  const handleExport = async () => {
    const data = {
      transactions: await db.transactions.toArray(),
      recurringRules: await db.recurringRules.toArray(),
      monthlyIncomes: await db.monthlyIncomes.toArray(),
      settings: await db.settings.toArray()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketwise_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDriveBackup = async () => {
    if (!clientId) {
      alert("Please configure your Google Client ID first.");
      return;
    }
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const data = {
        transactions: await db.transactions.toArray(),
        recurringRules: await db.recurringRules.toArray(),
        monthlyIncomes: await db.monthlyIncomes.toArray(),
        settings: await db.settings.toArray()
      };
      
      const driveService = new GoogleDriveService(clientId);
      const success = await driveService.uploadBackup(JSON.stringify(data));
      
      if (success) {
        setSyncStatus({ success: true, msg: 'Backup uploaded to Google Drive successfully.' });
        const existing = await db.settings.get('default');
        if (existing) {
          await db.settings.update('default', {
            googleDriveSync: { ...existing.googleDriveSync, lastBackup: Date.now() }
          });
        }
      } else {
        setSyncStatus({ success: false, msg: 'Failed to upload backup.' });
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
    if (!confirm('This will MERGE downloaded data with your local data. Duplicate transactions might occur if IDs differ. Continue?')) {
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const driveService = new GoogleDriveService(clientId);
      const data = await driveService.downloadBackup();
      
      if (data && data.transactions) {
        await db.transaction('rw', db.transactions, db.recurringRules, db.monthlyIncomes, db.settings, async () => {
          // Simple bulkPut for merge strategy
          if (data.transactions.length > 0) await db.transactions.bulkPut(data.transactions);
          if (data.recurringRules.length > 0) await db.recurringRules.bulkPut(data.recurringRules);
          if (data.monthlyIncomes.length > 0) await db.monthlyIncomes.bulkPut(data.monthlyIncomes);
          // Omit settings to prevent overwriting local client ID with a blank one from an old backup
        });
        setSyncStatus({ success: true, msg: 'Data restored successfully.' });
      } else {
        setSyncStatus({ success: false, msg: 'No valid backup found on Google Drive.' });
      }
    } catch (e: any) {
      setSyncStatus({ success: false, msg: e.message || 'Restore failed.' });
    }
    setIsSyncing(false);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      {/* Income Settings */}
      <section className="bg-navy-800 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-lg font-bold mb-4">Monthly Income ({format(new Date(), 'MMMM yyyy')})</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Base Salary (Take-home)</label>
            <div className="flex space-x-3">
              <input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="flex-1 bg-navy-900 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-mint-500"
                placeholder="0"
              />
              <button 
                onClick={handleSaveIncome}
                className="bg-mint-500 hover:bg-mint-400 text-navy-900 font-medium px-4 py-2 rounded-xl transition flex items-center space-x-2"
              >
                <Save size={18} />
                <span className="hidden sm:inline">Save</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Data & Backup Settings */}
      <section className="bg-navy-800 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <Cloud size={20} className="text-blue-400" />
          <span>Data & Backup</span>
        </h2>
        
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-4">
            <h3 className="font-semibold text-blue-400 flex items-center space-x-2 mb-2">
              <ShieldAlert size={16} />
              <span>Privacy First</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              Pocketwise is a client-side only application. To use cloud backup, you must provide your own Google OAuth Client ID.
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="flex-1 bg-navy-900 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Paste Google Client ID here..."
              />
              <button 
                onClick={handleSaveClientId}
                className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium px-4 py-2 rounded-xl transition"
              >
                Save
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleExport}
              className="flex flex-col items-center justify-center p-6 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition space-y-2 group"
            >
              <Download size={24} className="text-mint-400 group-hover:-translate-y-1 transition-transform" />
              <span className="font-medium">Export JSON Local</span>
            </button>

            <button 
              onClick={handleDriveBackup}
              disabled={isSyncing || !clientId}
              className={`flex flex-col items-center justify-center p-6 border border-slate-700 rounded-xl transition space-y-2 group ${isSyncing || !clientId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50'}`}
            >
              <Cloud size={24} className="text-blue-400 group-hover:-translate-y-1 transition-transform" />
              <span className="font-medium">{isSyncing ? 'Syncing...' : 'Backup to Drive'}</span>
            </button>
            
            <button 
              onClick={handleDriveRestore}
              disabled={isSyncing || !clientId}
              className={`flex flex-col items-center justify-center p-6 border border-slate-700 rounded-xl transition space-y-2 group md:col-span-2 ${isSyncing || !clientId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50'}`}
            >
              <Upload size={24} className="text-amber-400 group-hover:-translate-y-1 transition-transform" />
              <span className="font-medium">Restore from Drive</span>
              <span className="text-xs text-slate-400 text-center">Merge Google Drive backup with local data.</span>
            </button>
          </div>

          {syncStatus && (
            <div className={`p-4 rounded-xl flex items-center space-x-2 ${syncStatus.success ? 'bg-mint-500/10 text-mint-400 border border-mint-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              <CheckCircle2 size={18} />
              <span className="text-sm">{syncStatus.msg}</span>
            </div>
          )}
          
          {settings?.googleDriveSync?.lastBackup && (
            <p className="text-xs text-slate-500 text-center">
              Last Drive Backup: {format(new Date(settings.googleDriveSync.lastBackup), 'MMM d, yyyy HH:mm')}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Settings;
