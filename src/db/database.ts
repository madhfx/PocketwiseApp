import Dexie, { type Table } from 'dexie';
import type {
  Transaction,
  RecurringRule,
  MonthlyIncome,
  Merchant,
  Budget,
  Settings
} from './models';

export const DEFAULT_PRESET_MERCHANTS: Omit<Merchant, 'id' | 'createdAt'>[] = [
  { name: 'Swiggy', type: 'merchant', defaultCategory: 'Food & Dining', domain: 'swiggy.com', isFeatured: true, isPreset: true },
  { name: 'Zomato', type: 'merchant', defaultCategory: 'Food & Dining', domain: 'zomato.com', isFeatured: true, isPreset: true },
  { name: 'Blinkit', type: 'merchant', defaultCategory: 'Groceries', domain: 'blinkit.com', isFeatured: true, isPreset: true },
  { name: 'Zepto', type: 'merchant', defaultCategory: 'Groceries', domain: 'zeptonow.com', isFeatured: true, isPreset: true },
  { name: 'Amazon', type: 'merchant', defaultCategory: 'Shopping', domain: 'amazon.in', isFeatured: true, isPreset: true },
  { name: 'Flipkart', type: 'merchant', defaultCategory: 'Shopping', domain: 'flipkart.com', isFeatured: true, isPreset: true },
  { name: 'Uber', type: 'merchant', defaultCategory: 'Transport', domain: 'uber.com', isFeatured: true, isPreset: true },
  { name: 'Netflix', type: 'merchant', defaultCategory: 'Subscriptions', domain: 'netflix.com', isFeatured: true, isPreset: true },
  { name: 'YouTube', type: 'merchant', defaultCategory: 'Subscriptions', domain: 'youtube.com', isFeatured: false, isPreset: true },
  { name: 'Spotify', type: 'merchant', defaultCategory: 'Subscriptions', domain: 'spotify.com', isFeatured: false, isPreset: true },
  { name: 'Google Pay', type: 'merchant', defaultCategory: 'Other', domain: 'pay.google.com', isFeatured: false, isPreset: true },
  { name: 'PhonePe', type: 'merchant', defaultCategory: 'Other', domain: 'phonepe.com', isFeatured: false, isPreset: true },
  { name: 'Paytm', type: 'merchant', defaultCategory: 'Other', domain: 'paytm.com', isFeatured: false, isPreset: true },
  { name: 'Primary Employer', type: 'client', defaultCategory: 'Other', domain: 'google.com', isFeatured: false, isPreset: true },
  { name: 'Freelance Client', type: 'client', defaultCategory: 'Other', domain: 'upwork.com', isFeatured: false, isPreset: true }
];

export async function seedDefaultMerchantsIfEmpty(database: PocketwiseDatabase) {
  try {
    const count = await database.merchants.count();
    if (count === 0) {
      const now = Date.now();
      const records: Merchant[] = DEFAULT_PRESET_MERCHANTS.map((m, idx) => ({
        ...m,
        id: `merchant_${m.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx}`,
        createdAt: now
      }));
      await database.merchants.bulkAdd(records);
    }
  } catch (err) {
    console.error('Failed to seed default merchants:', err);
  }
}

export class PocketwiseDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  recurringRules!: Table<RecurringRule, string>;
  monthlyIncomes!: Table<MonthlyIncome, string>;
  merchants!: Table<Merchant, string>;
  budgets!: Table<Budget, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('PocketwiseDatabase');
    
    // Define schema
    this.version(1).stores({
      transactions: 'id, merchantId, category, date, type, source, recurringRuleId, occurrenceDate',
      recurringRules: 'id, category, frequency, status, mode',
      monthlyIncomes: 'id, month',
      merchants: 'id, name, isPreset',
      budgets: 'id, month, category',
      settings: 'id'
    });

    this.version(2).stores({
      merchants: 'id, name, type, isFeatured, isPreset'
    });

    this.on('ready', () => seedDefaultMerchantsIfEmpty(this));
  }
}

export const db = new PocketwiseDatabase();
// Seed immediately on export in case db was already opened
seedDefaultMerchantsIfEmpty(db);
