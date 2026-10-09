import { db } from './database';
import { startOfMonth, subDays, format } from 'date-fns';

export async function initializeDemoData() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthStart = startOfMonth(new Date());

  const hasSettings = await db.settings.count();
  if (hasSettings > 0) return;

  await db.transaction('rw', db.settings, db.monthlyIncomes, db.recurringRules, db.transactions, async () => {
    await db.settings.add({
      id: 'default',
      currency: 'INR',
      theme: 'system',
      defaultMonth: currentMonth,
      backupPreferences: {}
    });

    await db.monthlyIncomes.add({
      id: `income_${currentMonth}`,
      month: currentMonth,
      baseSalary: 125000,
      additionalIncome: 0
    });

    const swiggyRule = {
      id: 'demo_rule_1',
      merchantName: 'Swiggy',
      amount: 150,
      category: 'Food & Dining',
      frequency: 'daily' as const,
      interval: 1,
      startDate: format(monthStart, 'yyyy-MM-dd'),
      mode: 'forecast' as const,
      status: 'active' as const,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.recurringRules.add(swiggyRule);

    await db.transactions.add({
      id: 'demo_tx_1',
      amount: 450,
      merchantName: 'Amazon',
      category: 'Shopping',
      date: subDays(new Date(), 2).getTime(),
      type: 'expense',
      source: 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });
}
