import Dexie, { type Table } from 'dexie';
import type {
  Transaction,
  RecurringRule,
  MonthlyIncome,
  Merchant,
  Budget,
  Settings
} from './models';

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
  }
}

export const db = new PocketwiseDatabase();
