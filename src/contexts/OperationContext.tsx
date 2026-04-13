import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { Customer, CartItem } from '../types';
import { getAuthToken } from '../store/authStore';
import { api } from '../services/api';

interface ShoeService {
  service_id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
}

interface ShoeItem {
  id: string;
  category: string;
  color: string;
  services: ShoeService[];
}

interface Operation {
  id: string;
  customer: Customer | null;
  shoes: ShoeItem[];
  status: 'pending' | 'in_progress' | 'completed' | 'held' | 'cancelled';
  totalAmount: number;
  paidAmount?: number;
  discount?: number;
  isNoCharge?: boolean;
  isDoOver?: boolean;
  isDelivery?: boolean;
  isPickup?: boolean;
  notes?: string;
  created_by?: string;
  createdAt: string;
  updatedAt: string;
}

interface OperationContextType {
  operations: Operation[];
  addOperation: (operation: Omit<Operation, 'id' | 'createdAt' | 'updatedAt' | 'created_by'>) => Promise<Operation>;
  updateOperation: (id: string, operation: Partial<Operation>) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;
  getOperation: (id: string) => Operation | undefined;
  refreshOperations: () => Promise<void>;
  cartItems: CartItem[];
  ticketNumber: string;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setTicketNumber: (num: string) => void;
  fetchTicketNumber: () => Promise<string>;
}

const OperationContext = createContext<OperationContextType | undefined>(undefined);

export function OperationProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [ticketNumber, setTicketNumber] = useState<string>('');

  // Fetch operations when component mounts
  useEffect(() => {
    const fetchOperations = async () => {
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch('/api/operations?limit=500', { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch operations');
        }
        const result = await response.json();
        setOperations(result.data);
      } catch (error) {
        console.error('Error fetching operations:', error);
      }
    };

    fetchOperations();
  }, []);

  const addOperation = useCallback(async (operationData: Omit<Operation, 'id' | 'createdAt' | 'updatedAt' | 'created_by'>) => {
    try {
      // Get current user from localStorage
      const authUserStr = localStorage.getItem('auth_user');
      const authUser = authUserStr ? JSON.parse(authUserStr) : null;
      const userId = authUser?.id || null;
      const token = getAuthToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/operations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...operationData,
          created_by: userId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Failed to add operation: ${errorText}`);
      }

      const newOperation = await response.json() as Operation;

      // Update the operations state immediately with type safety
      setOperations(prevOperations => [...prevOperations, newOperation]);

      return newOperation;
    } catch (error) {
      console.error('Error adding operation:', error);
      throw error;
    }
  }, []);

  const updateOperation = useCallback(async (id: string, updates: Partial<Operation>) => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/operations/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update operation');
      }

      const updatedOperation = await response.json();
      setOperations(prev => prev.map(op => op.id === id ? updatedOperation : op));
    } catch (error) {
      console.error('Error updating operation:', error);
      throw error;
    }
  }, []);

  const deleteOperation = useCallback(async (id: string) => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/operations/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete operation');
      }

      setOperations(prev => prev.filter(op => op.id !== id));
    } catch (error) {
      console.error('Error deleting operation:', error);
      throw error;
    }
  }, []);

  const getOperation = useCallback((id: string) => {
    return operations.find(op => op.id === id);
  }, [operations]);

  const refreshOperations = useCallback(async () => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/operations?limit=500', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch operations');
      }
      const result = await response.json();
      setOperations(result.data);
    } catch (error) {
      console.error('Error refreshing operations:', error);
      throw error;
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      operations,
      addOperation,
      updateOperation,
      deleteOperation,
      getOperation,
      refreshOperations,
      cartItems,
      ticketNumber,
      addToCart: (item: CartItem) => setCartItems(prev => [...prev, item]),
      removeFromCart: (id: string) => setCartItems(prev => prev.filter(i => i.id !== id)),
      clearCart: () => { setCartItems([]); setTicketNumber(''); },
      setTicketNumber,
      fetchTicketNumber: async () => {
        const num = await api.ticket.getNext();
        setTicketNumber(num);
        return num;
      },
    }),
    [operations, refreshOperations]
  );

  return (
    <OperationContext.Provider value={contextValue}>
      {children}
    </OperationContext.Provider>
  );
}

export function useOperation() {
  const context = useContext(OperationContext);
  if (context === undefined) {
    throw new Error('useOperation must be used within an OperationProvider');
  }
  return context;
}
