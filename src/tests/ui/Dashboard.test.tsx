import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../../pages/app/Dashboard';
import { renderWithProviders, seedAuth, clearAuth, mockAdminUser } from '../utils';

// Mock the socket service — it creates intervals that would keep tests running
vi.mock('../../services/socket', () => ({
  connectSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
  disconnectSocket: vi.fn(),
}));

describe('Dashboard – UI', () => {
  beforeEach(() => {
    seedAuth(mockAdminUser);
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders the Dashboard heading', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('shows "Total Assets" stat card with value 128', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Total Assets')).toBeInTheDocument();
    });
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('shows "At Risk" stat card', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });
    // warning(12) + critical(6) = 18
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('shows "Active Work Orders" stat card', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Active Work Orders')).toBeInTheDocument();
    });
  });

  it('shows "Predicted Failures" stat card', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Predicted Failures')).toBeInTheDocument();
    });
  });

  it('shows "Asset Health Distribution" chart section', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Asset Health Distribution')).toBeInTheDocument();
    });
  });

  it('shows AI insights section', async () => {
    renderWithProviders(<Dashboard />);
    // AI Insights card title
    await waitFor(() => {
      expect(screen.getByText(/ai insights/i)).toBeInTheDocument();
    });
  });

  it('has Apply filter button', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });
  });
});
