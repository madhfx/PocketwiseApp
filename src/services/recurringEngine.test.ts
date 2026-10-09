import { describe, it, expect, vi } from 'vitest';
import { RecurringEngine } from './recurringEngine';
import { parseISO, format } from 'date-fns';
import type { RecurringRule } from '../db/models';

describe('RecurringEngine', () => {
  it('should calculate daily occurrences correctly within a month', () => {
    const rule: RecurringRule = {
      id: '1',
      merchantName: 'Test',
      amount: 150,
      category: 'Food',
      frequency: 'daily',
      startDate: '2026-10-01',
      mode: 'forecast',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const occurrences = RecurringEngine.getOccurrences(
      rule,
      parseISO('2026-10-01'), // From start of month
      parseISO('2026-10-10')  // To the 10th
    );

    // Occurrences from 1st to 10th = 10 occurrences
    expect(occurrences.length).toBe(10);
    expect(format(occurrences[0], 'yyyy-MM-dd')).toBe('2026-10-01');
    expect(format(occurrences[occurrences.length - 1], 'yyyy-MM-dd')).toBe('2026-10-10');
  });

  it('should calculate weekly occurrences correctly', () => {
    const rule: RecurringRule = {
      id: '2',
      merchantName: 'Weekly Test',
      amount: 500,
      category: 'Transport',
      frequency: 'weekly',
      interval: 1,
      startDate: '2026-10-05', // A Monday
      mode: 'forecast',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const occurrences = RecurringEngine.getOccurrences(
      rule,
      parseISO('2026-10-01'),
      parseISO('2026-10-31')
    );

    // Oct 5, 12, 19, 26 = 4 occurrences
    expect(occurrences.length).toBe(4);
    expect(format(occurrences[0], 'yyyy-MM-dd')).toBe('2026-10-05');
    expect(format(occurrences[3], 'yyyy-MM-dd')).toBe('2026-10-26');
  });

  it('should stop accruing after endDate', () => {
    const rule: RecurringRule = {
      id: '3',
      merchantName: 'Limited Test',
      amount: 100,
      category: 'Food',
      frequency: 'daily',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      mode: 'forecast',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const occurrences = RecurringEngine.getOccurrences(
      rule,
      parseISO('2026-10-01'),
      parseISO('2026-10-31')
    );

    // 1st through 5th = 5 occurrences
    expect(occurrences.length).toBe(5);
  });
});
