import {
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseAnalytics,
  ExpenseFilters
} from '../types/expense';
import { getAuthToken } from '../store/authStore';

const API_BASE = 'http://localhost:3000/api';

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export interface PaginatedExpenses {
  expenses: Expense[];
  total: number;
  limit: number;
  offset: number;
}

export const getExpenses = async (filters?: ExpenseFilters): Promise<PaginatedExpenses> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters?.offset !== undefined) params.append('offset', filters.offset.toString());

  const response = await fetch(`${API_BASE}/expenses?${params.toString()}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch expenses');
  }

  return response.json();
};

export const getExpense = async (id: string): Promise<Expense> => {
  const response = await fetch(`${API_BASE}/expenses/${id}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch expense');
  }

  return response.json();
};

export const createExpense = async (data: CreateExpenseInput): Promise<Expense> => {
  const response = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to create expense');
  }

  return response.json();
};

export const updateExpense = async (id: string, data: UpdateExpenseInput): Promise<Expense> => {
  const response = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to update expense');
  }

  return response.json();
};

export const deleteExpense = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to delete expense');
  }
};

export const getExpenseAnalytics = async (): Promise<ExpenseAnalytics> => {
  const response = await fetch(`${API_BASE}/expenses/analytics`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch expense analytics');
  }

  return response.json();
};

export const getExpenseCategories = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE}/expenses/categories`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch expense categories');
  }

  return response.json();
};

export interface ProfitSummary {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salesThisMonth: number;
  expensesThisMonth: number;
  profitThisMonth: number;
  salesTrend: number;
  expenseTrend: number;
  profitTrend: number;
  monthlyBreakdown: {
    month: string;
    sales: number;
    expenses: number;
    profit: number;
  }[];
}

export const getProfitSummary = async (): Promise<ProfitSummary> => {
  const response = await fetch(`${API_BASE}/analytics/profit-summary`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profit summary');
  }

  return response.json();
};

export interface DailyBalance {
  date: string;
  sales: {
    total: number;
    byMethod: {
      cash: number;
      mobileMoney: number;
      card: number;
      bankTransfer: number;
      cheque: number;
    };
  };
  expenses: {
    total: number;
    byMethod: {
      cash: number;
      mobileMoney: number;
      card: number;
      bankTransfer: number;
      cheque: number;
    };
  };
  balance: {
    cashAtHand: number;
    mobileMoney: number;
    card: number;
    bankTransfer: number;
    cheque: number;
  };
  netBalance: number;
}

export const getDailyBalance = async (date?: string): Promise<DailyBalance> => {
  const params = date ? `?date=${date}` : '';
  const response = await fetch(`${API_BASE}/analytics/daily-balance${params}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch daily balance');
  }

  return response.json();
};
