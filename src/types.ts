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
