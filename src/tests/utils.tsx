import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';

// ─── Test theme ───────────────────────────────────────────────────────────────
const testTheme = createTheme();

// Minimal ThemeContext value to satisfy useThemeMode() consumers
const themeContextValue = {
  mode: 'light',
  isDark: false,
  toggleTheme: () => {},
};

// ─── Provider wrapper ─────────────────────────────────────────────────────────
interface WrapperProps {
  children: React.ReactNode;
  initialPath?: string;
}

const AllProviders = ({ children, initialPath = '/' }: WrapperProps) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeProvider theme={testTheme}>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  </MemoryRouter>
);

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialPath?: string }
) => {
  const { initialPath, ...rest } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialPath={initialPath}>{children}</AllProviders>
    ),
    ...rest,
  });
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const mockAdminUser = {
  id: 1,
  name: 'Ahmed Mohamed',
  email: 'admin@abc.com',
  role: 'admin' as const,
  avatar: null,
  first_login: false,
  company_id: 1,
  created_at: '2025-01-01T08:00:00Z',
};

export const mockEngineerUser = {
  id: 2,
  name: 'Sara Ahmed',
  email: 'sara@abc.com',
  role: 'engineer' as const,
  avatar: null,
  first_login: false,
  company_id: 1,
  created_at: '2025-01-15T08:00:00Z',
};

/** Pre-seed sessionStorage so AuthProvider initialises with an authenticated user. */
export const seedAuth = (user: Record<string, unknown> = mockAdminUser, token = 'test-token-123') => {
  sessionStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('token', token);
};

export const clearAuth = () => {
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
};
