export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: 'active' | 'inactive';
  totalOrders: number;
  totalSpent: number;
  lastVisit: string;
  loyaltyPoints: number;
  accountBalance?: number;
}

export interface ServiceSelection {
  service: string;
  variation: string;
}

export interface CartItem {
  id: string;
  category: string;
  size?: string;
  color: string;
  brand: string;
  material: string;
  shortDescription: string;
  memos: string[];
  services: ServiceSelection[];
  price: number;
  readyByDate?: string;
}

export interface DropFormState {
  customerId: string;
  category: string;
  size: string;
  color: string;
  brand: string;
  material: string;
  shortDescription: string;
  memos: string[];
  service: string;
  variation: string;
  price: string;
  readyByDate: string;
}
