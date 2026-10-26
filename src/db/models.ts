export interface Transaction {
  id: string;
  amount: number;
  merchantId?: string;
  merchantName: string;
  category: string;
  date: number; // timestamp
  note?: string;
  paymentMethod?: string;
  type: 'expense' | 'income';
  source: 'manual' | 'recurring';
  recurringRuleId?: string;
  occurrenceDate?: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
}

export interface RecurringRule {
  id: string;
  merchantName: string;
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number; // e.g. every 1 week, every 2 weeks
  weekdays?: number[]; // 0=Sun, 1=Mon, etc. for weekly
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  mode: 'forecast' | 'auto-record';
  status: 'active' | 'paused' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export interface MonthlyIncome {
  id: string;
  month: string; // YYYY-MM
  baseSalary: number;
  additionalIncome: number;
  notes?: string;
}

export interface Merchant {
  id: string;
  name: string;
  type: 'merchant' | 'client' | 'both';
  defaultCategory: string;
  domain?: string;
  logoUrl?: string; // Direct image URL or base64 data URL
  isFeatured: boolean;
  isPreset: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  category: string;
  limit: number;
}

export interface Settings {
  id: string;
  currency: string;
  theme: 'dark' | 'light' | 'system';
  defaultMonth: string; // current month format
  backupPreferences: any;
  googleDriveSync?: {
    clientId?: string;
    lastBackup?: number;
    autoBackup?: boolean;
  };
}
