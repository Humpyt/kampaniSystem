import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { Customer } from '../types';
import { api } from '../services/api';

interface CustomerContextType {
  customers: Customer[];
  fetchCustomers: (params?: { limit?: number; offset?: number; search?: string }) => Promise<void>;
  addCustomer: (customerData: Omit<Customer, 'id'>) => Promise<Customer>;
  updateCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (params?: { limit?: number; offset?: number; search?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.customers.getAll(params);
      setCustomers(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<Customer> => {
    try {
      setError(null);
      const newCustomer = await api.customers.create(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add customer');
      throw err;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      setError(null);
      const updatedCustomer = await api.customers.update(id, customerData);
      setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer');
      throw err;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      setError(null);
      await api.customers.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
      throw err;
    }
  };

  const contextValue = useMemo(
    () => ({
      customers,
      fetchCustomers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      loading,
      error,
    }),
    [customers, loading, error, fetchCustomers]
  );

  return (
    <CustomerContext.Provider value={contextValue}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
