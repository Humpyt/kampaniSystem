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

const parseResponseBody = async (response: Response) => {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { error: rawText };
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  initializing: true,

  login: async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await parseResponseBody(response);

      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : 'Login service is unavailable. Please check that the server is running.';
        throw new Error(message);
      }

      if (
        !payload ||
        typeof payload !== 'object' ||
        !('user' in payload) ||
        !('token' in payload)
      ) {
        throw new Error('Login service returned an invalid response.');
      }

      const { user, token } = payload as { user: AuthUser; token: string };

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

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');

    if (token && userStr) {
      try {
        // Parse user from localStorage immediately
        const user = JSON.parse(userStr);
        if (user && user.id && user.email && user.role) {
          // Trust token exists - set authenticated immediately
          set({ user, token, isAuthenticated: true, initializing: false });

          // Validate token in background - don't block UI
          fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          }).then(response => {
            if (!response.ok) {
              // Token invalid, clear storage and force re-login
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              set({ user: null, token: null, isAuthenticated: false, initializing: false });
            }
          }).catch(() => {
            // Network error - ignore, user stays authenticated
          });
        } else {
          throw new Error('Invalid user data');
        }
      } catch (error) {
        console.error('Auth check error:', error);
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
