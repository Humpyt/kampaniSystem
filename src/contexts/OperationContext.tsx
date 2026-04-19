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
  workflowStatus: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  totalAmount: number;
  paidAmount?: number;
  discount?: number;
  isNoCharge?: boolean;
  isDoOver?: boolean;
  isDelivery?: boolean;
  isPickup?: boolean;
  notes?: string;
  promisedDate?: string;
  pickedUpAt?: string;
  created_by?: string;
  createdAt: string;
  updatedAt: string;
  paymentRecords?: any[];
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
  updateCartItem: (id: string, item: CartItem) => void;
  clearCart: () => void;
  setTicketNumber: (num: string) => void;
  fetchTicketNumber: () => Promise<string>;
}

const OperationContext = createContext<OperationContextType | undefined>(undefined);

const normalizeOperation = (operation: any): Operation => ({
  ...operation,
  customer: operation.customer || null,
  shoes: Array.isArray(operation.shoes) ? operation.shoes : [],
  workflowStatus: operation.workflowStatus || 'pending',
  paymentStatus: operation.paymentStatus || 'unpaid',
  paidAmount: Number(operation.paidAmount) || 0,
  totalAmount: Number(operation.totalAmount) || 0,
  discount: Number(operation.discount) || 0,
  createdAt: operation.createdAt || new Date().toISOString(),
  updatedAt: operation.updatedAt || operation.createdAt || new Date().toISOString(),
  paymentRecords: Array.isArray(operation.paymentRecords) ? operation.paymentRecords : [],
});

const sortOperationsByNewest = (operations: Operation[]) =>
  [...operations].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });

const mergeAndSortOperations = (operations: Operation[]) => {
  const operationMap = new Map<string, Operation>();

  for (const operation of operations) {
    if (!operation?.id) continue;
    operationMap.set(operation.id, normalizeOperation(operation));
  }

  return sortOperationsByNewest(Array.from(operationMap.values()));
};

export function OperationProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [ticketNumber, setTicketNumber] = useState<string>('');

  // Fetch operations when component mounts
  useEffect(() => {
    const fetchOperations = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
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
        setOperations(mergeAndSortOperations(result.data || []));
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
      setOperations(prevOperations => mergeAndSortOperations([newOperation, ...prevOperations]));

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
      setOperations(prev =>
        mergeAndSortOperations(prev.map(op => (op.id === id ? updatedOperation : op)))
      );
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
      setOperations(mergeAndSortOperations(result.data || []));
    } catch (error) {
      console.error('Error refreshing operations:', error);
      throw error;
    }
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCartItems(prev => [...prev, item]);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateCartItem = useCallback((id: string, updatedItem: CartItem) => {
    setCartItems(prev => prev.map(i => i.id === id ? updatedItem : i));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setTicketNumber('');
  }, []);

  const fetchTicketNumber = useCallback(async () => {
    try {
      const num = await api.ticket.getNext();
      setTicketNumber(num);
      return num;
    } catch (err) {
      console.error('Failed to fetch ticket number:', err);
      throw err;
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
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      setTicketNumber,
      fetchTicketNumber,
    }),
    [operations, refreshOperations, cartItems, ticketNumber, setCartItems, setTicketNumber, addToCart, removeFromCart, updateCartItem, clearCart, fetchTicketNumber]
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
