import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

const VALID_ROLES = ['admin', 'engineer', 'technician'] as const;

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialise user synchronously from sessionStorage so the very first
    // render already has the correct auth state — this eliminates the
    // flash where user is null and ProtectedRoute might redirect.
    try {
      const storedUser = sessionStorage.getItem('user');
      const storedToken = sessionStorage.getItem('token');
      if (storedUser && storedToken) {
        const parsed: User = JSON.parse(storedUser);
        if (parsed && parsed.role && VALID_ROLES.includes(parsed.role as typeof VALID_ROLES[number])) {
          console.log('[Auth] Restored user from sessionStorage:', parsed.email, 'role:', parsed.role);
          return parsed;
        }
        // Invalid / corrupt stored user — clear it
        console.warn('[Auth] Stored user has invalid role:', parsed?.role, '— clearing session');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
      }
    } catch {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await api.login(email, password) as any;
      const { user: userData, token } = response;

      if (!userData?.role || !VALID_ROLES.includes(userData.role)) {
        throw new Error('Server returned invalid user role');
      }

      console.log('[Auth] Login success:', userData.email, 'role:', userData.role);
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', token);
      setUser(userData);

      return userData;
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const updatedUser = { ...prevUser, ...updates } as User;
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
