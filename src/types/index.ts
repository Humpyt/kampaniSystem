export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  specialization: ('shoe' | 'bag')[];
  active: boolean;
  currentWorkload: number;
  dailyTarget: number;
  currentProgress: number;
}

export interface RepairService {
  id: string;
  name: string;
  type: 'shoe' | 'bag';
  description: string;
  price: number;
  estimatedDays: number;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive';
  totalOrders: number;
  totalSpent: number;
  lastVisit: string;
  loyaltyPoints: number;
  accountBalance?: number;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'credit' | 'ticket';
  amount: number;
  date: string;
  description: string;
  customerId?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: 'leather' | 'soles' | 'laces' | 'zippers' | 'thread' | 'adhesive' | 'other';
  description: string;
  quantity: number;
  unit: 'pieces' | 'meters' | 'pairs' | 'liters' | 'rolls';
  minQuantity: number;
  price: number;
  supplier: string;
  location: string;
  lastRestocked: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
  active: boolean;
  lastLogin: string;
}

export interface RepairItem {
  id: string;
  type: 'shoe' | 'bag' | 'other';
  customType?: string;
  customerName: string;
  contactNumber: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'ready-for-pickup';
  dateReceived: string;
  estimatedCompletion: string;
  price: number;
  assignedStaffId?: string;
  selectedServices: string[];
  balanceDue?: number;
  itemImageUrl?: string;
}

export interface AuthState {
  user: Omit<User, 'password'> | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export type PageType = 'store' | 'customer' | 'pickup' | 'delivery';

// Re-export expense types
export * from './expense';

export interface ServiceSelection {
  service: string;
  variation: string;
}

export interface CartItem {
  id: string;           // temp uuid
  category: string;
  color: string;
  brand: string;
  material: string;
  shortDescription: string;  // optional free text
  memos: string[];      // multi-select
  services: ServiceSelection[];
  price: number;        // manually entered
}

export interface DropFormState {
  customerId: string;
  category: string;
  color: string;
  brand: string;
  material: string;
  shortDescription: string;
  memos: string[];
  service: string;
  variation: string;
  price: string;
}
