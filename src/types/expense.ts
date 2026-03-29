export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  vendor?: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  title: string;
  category: string;
  amount: number;
  date: string;
  status?: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  vendor?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateExpenseInput {
  title?: string;
  category?: string;
  amount?: number;
  date?: string;
  status?: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  vendor?: string;
  notes?: string;
}

export interface ExpenseAnalytics {
  totalThisMonth: number;
  totalThisWeek: number;
  totalToday: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  weeklyTrends: {
    day: string;
    amount: number;
  }[];
  monthlyTrends: {
    month: string;
    amount: number;
  }[];
  recentExpenses: Expense[];
  statusBreakdown: {
    status: string;
    count: number;
    amount: number;
  }[];
  paymentMethodBreakdown: {
    method: string;
    amount: number;
    count: number;
  }[];
  topCategories: {
    category: string;
    amount: number;
    color: string;
  }[];
}

export interface ExpenseFilters {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export const EXPENSE_CATEGORIES = [
  'Supplies & Materials',
  'Rent & Utilities',
  'Salaries & Wages',
  'Marketing & Advertising',
  'Equipment & Maintenance',
  'Transportation',
  'Insurance',
  'Taxes & Fees',
  'Office Supplies',
  'Miscellaneous'
] as const;

export const EXPENSE_STATUSES = ['paid', 'pending', 'overdue'] as const;

export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Mobile Money',
  'Credit Card',
  'Cheque'
] as const;
