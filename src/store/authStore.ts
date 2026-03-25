import { create } from 'zustand';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  initializing: true,

  login: async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      const { user, token } = data;

      set({
        user,
        token,
        isAuthenticated: true,
        initializing: false,
      });

      // Store in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    } catch (error) {
      console.error('Login error:', error);
      set({ initializing: false });
      throw error;
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      initializing: false,
    });

    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');

    if (token && userStr) {
      try {
        // Verify token is still valid by fetching current user
        const response = await fetch('http://localhost:3000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          set({
            user,
            token,
            isAuthenticated: true,
            initializing: false,
          });
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          set({ user: null, token: null, isAuthenticated: false, initializing: false });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear invalid auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ user: null, token: null, isAuthenticated: false, initializing: false });
      }
    } else {
      // No token found, not initializing
      set({ initializing: false });
    }
  },

  updateUser: (data: Partial<AuthUser>) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...data };
      set({ user: updatedUser });
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;

    // Admin has all permissions
    if (user.role === 'admin') return true;

    // Check if user has specific permission
    return user.permissions?.includes(permission) || false;
  },
}));

// Helper hook to get auth token for API calls
export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Helper function to make authenticated API calls
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
};
