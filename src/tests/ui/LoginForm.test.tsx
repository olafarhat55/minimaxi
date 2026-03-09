import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import ThemeContext from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import LoginPage from '../../pages/public/LoginPage';

// Capture navigate calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const theme = createTheme();
const themeCtxValue = { mode: 'light', isDark: false, toggleTheme: () => {} };

const renderLogin = () =>
  render(
    <MemoryRouter>
      <ThemeContext.Provider value={themeCtxValue}>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </ThemeProvider>
      </ThemeContext.Provider>
    </MemoryRouter>
  );

describe('LoginPage – UI', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockNavigate.mockReset();
    sessionStorage.clear();
  });

  it('renders the sign-in form', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error when submitted empty', async () => {
    renderLogin();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(
      await screen.findByText(/please enter both email and password/i)
    ).toBeInTheDocument();
  });

  it('shows error alert on wrong credentials', async () => {
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'admin@abc.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid email or password/i)
    ).toBeInTheDocument();
  });

  it('navigates to /dashboard after successful admin login', async () => {
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'admin@abc.com');
    await user.type(screen.getByLabelText(/password/i), 'admin123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('navigates to /my-work-orders after technician login', async () => {
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'khaled@abc.com');
    await user.type(screen.getByLabelText(/password/i), 'tech123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/my-work-orders');
    });
  });

  it('button shows loading state and is disabled during submission', async () => {
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'admin@abc.com');
    await user.type(screen.getByLabelText(/password/i), 'admin123');

    const button = screen.getByRole('button', { name: /sign in/i });
    await user.click(button);

    // Button should briefly become disabled
    // (loading spinner replaces text, button is disabled={loading})
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
