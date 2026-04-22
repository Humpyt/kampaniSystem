import { create } from 'zustand';

export interface PolicyDropContext {
  ticketNumber: string;
  customerNumber: string;
  customerName: string;
  date: string;
  customerId?: string;
}

interface PolicyStore {
  lastDrop: PolicyDropContext | null;
  setLastDrop: (drop: PolicyDropContext | null) => void;
}

export const usePolicyStore = create<PolicyStore>((set) => ({
  lastDrop: null,
  setLastDrop: (drop) => set({ lastDrop: drop }),
}));
