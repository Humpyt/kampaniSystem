import { Customer, Order, Service } from '../types';

const API_URL = '/api';

export const api = {
  // Customer endpoints
  customers: {
    getAll: async (params?: { limit?: number; offset?: number; search?: string }): Promise<{ data: Customer[]; pagination: { total: number; hasMore: boolean } }> => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.search) searchParams.set('search', params.search);

      const response = await fetch(`${API_URL}/customers?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const result = await response.json();

      // Transform snake_case to camelCase
      return {
        data: result.data.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || '',
        status: customer.status || 'active',
        totalOrders: customer.total_orders || 0,
        totalSpent: customer.total_spent || 0,
        lastVisit: customer.last_visit || '',
        loyaltyPoints: customer.loyalty_points || 0,
        accountBalance: customer.account_balance,
      })),
        pagination: result.pagination
      };
    },

    create: async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
      });
      if (!response.ok) throw new Error('Failed to create customer');
      const created: any = await response.json();
      // Transform snake_case from API to camelCase for frontend
      return {
        id: created.id,
        name: created.name,
        phone: created.phone,
        email: created.email || '',
        address: created.address || '',
        notes: created.notes || '',
        status: created.status || 'active',
        totalOrders: created.total_orders || 0,
        totalSpent: created.total_spent || 0,
        lastVisit: created.last_visit || '',
        loyaltyPoints: created.loyalty_points || 0,
        accountBalance: created.account_balance,
      };
    },

    update: async (id: string, customer: Partial<Customer>): Promise<Customer> => {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
      });
      if (!response.ok) throw new Error('Failed to update customer');
      return response.json();
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete customer');
    },
  },

  // Order endpoints
  orders: {
    getAll: async (): Promise<Order[]> => {
      const response = await fetch(`${API_URL}/orders`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },

    create: async (order: {
      customer_id: string;
      items: Array<{
        service_id: string;
        quantity: number;
        price: number;
        notes?: string;
      }>;
      notes?: string;
      promised_date?: string;
    }): Promise<Order> => {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
  },

  // Service endpoints
  services: {
    getAll: async (): Promise<Service[]> => {
      const response = await fetch(`${API_URL}/services`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },

    create: async (service: Omit<Service, 'id'>): Promise<Service> => {
      const response = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(service),
      });
      if (!response.ok) throw new Error('Failed to create service');
      return response.json();
    },
  },

  // Ticket endpoints
  ticket: {
    getNext: async (): Promise<string> => {
      const response = await fetch(`${API_URL}/ticket/next`);
      const data = await response.json();
      return data.ticket_number;
    },
  },
};
