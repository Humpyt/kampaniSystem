import { Customer, Order, Service } from '../types';
import { getAuthToken } from '../store/authStore';

const API_URL = '/api';
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const inFlightRequests = new Map<string, Promise<unknown>>();

const withAuthHeaders = (headers: Record<string, string> = {}) => {
  const token = getAuthToken();
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const cachedJson = async <T>(url: string, ttlMs = 15000): Promise<T> => {
  const now = Date.now();
  const cached = responseCache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const inFlight = inFlightRequests.get(url);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const request = fetch(url)
    .then(async response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
      }
      const value = await response.json();
      responseCache.set(url, { expiresAt: Date.now() + ttlMs, value });
      return value;
    })
    .finally(() => {
      inFlightRequests.delete(url);
    });

  inFlightRequests.set(url, request);
  return request as Promise<T>;
};

const clearApiCache = (prefix: string) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchJsonWithRetry = async <T>(
  url: string,
  opts: { signal?: AbortSignal; timeoutMs?: number; retries?: number } = {}
): Promise<T> => {
  const { signal, timeoutMs = 8000, retries = 2 } = opts;
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const relayAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', relayAbort, { once: true });

    try {
      const response = await fetch(url, { signal: controller.signal, headers: withAuthHeaders() });
      if (!response.ok) {
        let errorMessage = `Failed to fetch ${url}`;
        try {
          const payload = await response.json();
          if (payload && typeof payload === 'object' && typeof (payload as any).error === 'string') {
            errorMessage = (payload as any).error;
          }
        } catch {
          // Keep fallback message when response body is not JSON
        }

        const statusMessage = `${response.status} ${response.statusText}`.trim();
        const combinedMessage = `${errorMessage} (${statusMessage})`;

        if (response.status >= 500 && attempt < retries) {
          throw new Error(combinedMessage);
        }
        throw new Error(combinedMessage);
      }
      return await response.json() as T;
    } catch (error) {
      lastError = error;
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (isAbort || attempt >= retries) {
        throw error;
      }
      await sleep(250 * (attempt + 1));
    } finally {
      clearTimeout(timeout);
      if (signal) signal.removeEventListener('abort', relayAbort);
    }

    attempt += 1;
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch');
};

const transformServiceRecord = (service: any): Service => ({
  id: service.id,
  name: service.name,
  description: service.description || '',
  price: Number(service.price) || 0,
  pricingMode: service.pricingMode || service.pricing_mode || 'fixed',
  minPrice: service.minPrice !== undefined
    ? service.minPrice
    : (service.min_price !== undefined ? Number(service.min_price) : null),
  maxPrice: service.maxPrice !== undefined
    ? service.maxPrice
    : (service.max_price !== undefined ? Number(service.max_price) : null),
  unitLabel: service.unitLabel || service.unit_label || '',
  priceNote: service.priceNote || service.price_note || '',
  estimatedDays: service.estimatedDays || service.estimated_days || 1,
  category: service.category || '',
  status: service.status || 'active',
  createdAt: service.createdAt || service.created_at,
  updatedAt: service.updatedAt || service.updated_at,
} as Service);

export const api = {
  // Customer endpoints
  customers: {
    getAll: async (
      params?: {
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: 'name' | 'recent' | 'spent' | 'visits';
        sortDir?: 'asc' | 'desc';
        minSpent?: number;
        minVisits?: number;
        status?: 'active' | 'inactive';
      },
      opts?: { signal?: AbortSignal }
    ): Promise<{ data: Customer[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } }> => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortDir) searchParams.set('sortDir', params.sortDir);
      if (params?.minSpent) searchParams.set('minSpent', String(params.minSpent));
      if (params?.minVisits) searchParams.set('minVisits', String(params.minVisits));
      if (params?.status) searchParams.set('status', params.status);

      const url = `${API_URL}/customers?${searchParams}`;
      const result = await fetchJsonWithRetry<{ data: any[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } }>(
        url,
        { signal: opts?.signal }
      );

      // Transform snake_case to camelCase, capitalize first letter of name
      return {
        data: result.data.map((customer: any) => ({
        id: customer.id,
        name: (customer.name || '').charAt(0).toUpperCase() + (customer.name || '').slice(1),
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
      // Capitalize first letter of name before sending
      const capitalizedCustomer = {
        ...customer,
        name: customer.name ? customer.name.trim().charAt(0).toUpperCase() + customer.name.trim().slice(1) : '',
      };
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(capitalizedCustomer),
      });
      if (!response.ok) throw new Error('Failed to create customer');
      clearApiCache(`${API_URL}/customers`);
      const created: any = await response.json();
      // Transform snake_case from API to camelCase for frontend
      return {
        id: created.id,
        name: (created.name || '').charAt(0).toUpperCase() + (created.name || '').slice(1),
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
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(customer),
      });
      if (!response.ok) throw new Error('Failed to update customer');
      clearApiCache(`${API_URL}/customers`);
      return response.json();
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: withAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete customer');
      clearApiCache(`${API_URL}/customers`);
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
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
  },

  // Service endpoints
  services: {
    getAll: async (): Promise<Service[]> => {
      const services = await cachedJson<any[]>(`${API_URL}/services`, 30000);
      return Array.isArray(services) ? services.map(transformServiceRecord) : [];
    },

    create: async (service: Omit<Service, 'id'>): Promise<Service> => {
      const response = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(service),
      });
      if (!response.ok) throw new Error('Failed to create service');
      clearApiCache(`${API_URL}/services`);
      return transformServiceRecord(await response.json());
    },

    update: async (id: string, service: Partial<Service>): Promise<Service> => {
      const response = await fetch(`${API_URL}/services/${id}`, {
        method: 'PATCH',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(service),
      });
      if (!response.ok) throw new Error('Failed to update service');
      clearApiCache(`${API_URL}/services`);
      return transformServiceRecord(await response.json());
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete service');
      clearApiCache(`${API_URL}/services`);
    },
  },

  // Ticket endpoints
  ticket: {
    getNext: async (): Promise<string> => {
      const response = await fetch(`${API_URL}/ticket/next`);
      if (!response.ok) throw new Error('Failed to fetch next ticket number');
      const data = await response.json();
      return data.ticket_number;
    },
  },

  // Operation endpoints
  operations: {
    create: async (data: {
      customer_id?: string;
      items: Array<{
        category: string;
        color: string;
        brand: string;
        material: string;
        shortDescription: string;
        memos: string[];
        services: Array<{ service: string; variation: string }>;
        price: number;
      }>;
    }): Promise<{ id: string }> => {
      const response = await fetch(`${API_URL}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create operation');
      return response.json();
    },
  },
};
