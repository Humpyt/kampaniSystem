import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseAnalytics,
  ExpenseFilters
} from '../types/expense';
import {
  getExpenses,
  createExpense as apiCreateExpense,
  updateExpense as apiUpdateExpense,
  deleteExpense as apiDeleteExpense,
  getExpenseAnalytics
} from '../api/expenses';
import { getAuthToken } from '../store/authStore';

interface ExpensePagination {
  total: number;
  limit: number;
  offset: number;
}

interface ExpenseContextType {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  analytics: ExpenseAnalytics | null;
  pagination: ExpensePagination;
  fetchExpenses: (filters?: ExpenseFilters) => Promise<void>;
  loadMoreExpenses: (filters?: ExpenseFilters) => Promise<void>;
  addExpense: (data: CreateExpenseInput) => Promise<Expense>;
  updateExpense: (id: string, data: UpdateExpenseInput) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  clearError: () => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [pagination, setPagination] = useState<ExpensePagination>({ total: 0, limit: 20, offset: 0 });

  const fetchExpenses = useCallback(async (filters?: ExpenseFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExpenses(filters);
      setExpenses(data.expenses);
      setPagination({
        total: data.total,
        limit: data.limit,
        offset: data.offset
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch expenses';
      setError(message);
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreExpenses = useCallback(async (filters?: ExpenseFilters) => {
    try {
      setLoading(true);
      setError(null);
      const nextOffset = pagination.offset + pagination.limit;
      const data = await getExpenses({ ...filters, offset: nextOffset });
      setExpenses(prev => [...prev, ...data.expenses]);
      setPagination({
        total: data.total,
        limit: data.limit,
        offset: data.offset
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more expenses';
      setError(message);
      console.error('Error loading more expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  const addExpense = useCallback(async (data: CreateExpenseInput): Promise<Expense> => {
    try {
      setLoading(true);
      setError(null);
      const newExpense = await apiCreateExpense(data);
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create expense';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExpense = useCallback(async (id: string, data: UpdateExpenseInput): Promise<Expense> => {
    try {
      setLoading(true);
      setError(null);
      const updatedExpense = await apiUpdateExpense(id, data);
      setExpenses(prev => prev.map(exp => exp.id === id ? updatedExpense : exp));
      return updatedExpense;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update expense';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await apiDeleteExpense(id);
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete expense';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExpenseAnalytics();
      setAnalytics(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
      console.error('Error fetching expense analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      expenses,
      loading,
      error,
      analytics,
      pagination,
      fetchExpenses,
      loadMoreExpenses,
      addExpense,
      updateExpense,
      deleteExpense,
      fetchAnalytics,
      clearError
    }),
    [expenses, loading, error, analytics, pagination, fetchExpenses, loadMoreExpenses, addExpense, updateExpense, deleteExpense, fetchAnalytics, clearError]
  );

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
