import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Alerts from '../../pages/app/Alerts';
import { renderWithProviders, seedAuth, clearAuth, mockAdminUser } from '../utils';

/**
 * NOTE ON TEST ORDER
 * mockApi uses module-level in-memory state shared across all tests within this
 * file (same Vitest worker). The "clicking Acknowledge" test mutates that state,
 * so it is intentionally placed LAST to avoid affecting the other assertions.
 */

describe('AlertsList – UI', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    seedAuth(mockAdminUser);
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders the Alerts heading', async () => {
    renderWithProviders(<Alerts />);
    expect(await screen.findByText('Alerts')).toBeInTheDocument();
  });

  it('shows "2 Unread" chip', async () => {
    renderWithProviders(<Alerts />);
    await waitFor(() => {
      expect(screen.getByText('2 Unread')).toBeInTheDocument();
    });
  });

  it('shows "1 Critical" chip', async () => {
    renderWithProviders(<Alerts />);
    await waitFor(() => {
      expect(screen.getByText('1 Critical')).toBeInTheDocument();
    });
  });

  it('shows "2 Warning" chip', async () => {
    renderWithProviders(<Alerts />);
    await waitFor(() => {
      expect(screen.getByText('2 Warning')).toBeInTheDocument();
    });
  });

  it('renders all 4 alert titles', async () => {
    renderWithProviders(<Alerts />);
    await waitFor(() => {
      expect(screen.getByText('High Failure Probability Detected')).toBeInTheDocument();
    });
    expect(screen.getByText('Temperature Threshold Exceeded')).toBeInTheDocument();
    expect(screen.getByText('Unusual Vibration Pattern')).toBeInTheDocument();
    expect(screen.getByText('Scheduled Maintenance Due')).toBeInTheDocument();
  });

  it('Acknowledge button is visible only for unacknowledged alerts', async () => {
    renderWithProviders(<Alerts />);
    await waitFor(() => {
      expect(screen.getByText('Unusual Vibration Pattern')).toBeInTheDocument();
    });

    // Alerts 3 & 4 are unacknowledged in the initial mock data
    const acknowledgeBtns = screen.getAllByRole('button', { name: /acknowledge/i });
    expect(acknowledgeBtns.length).toBe(2);
  });

  it('filter "Critical Only" shows only the critical alert', async () => {
    renderWithProviders(<Alerts />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('High Failure Probability Detected')).toBeInTheDocument();
    });

    // Open MUI Select using mouseDown (triggers MUI's internal open handler)
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    // Select the "Critical Only" option from the portal listbox
    const option = await screen.findByRole('option', { name: /critical only/i });
    fireEvent.click(option);

    // After filter: only critical alert visible, non-critical hidden
    await waitFor(() => {
      expect(screen.getByText('High Failure Probability Detected')).toBeInTheDocument();
      expect(screen.queryByText('Unusual Vibration Pattern')).not.toBeInTheDocument();
      expect(screen.queryByText('Scheduled Maintenance Due')).not.toBeInTheDocument();
    });
  });

  // ── Must be LAST — mutates shared mockApi in-memory state ─────────────────
  it('clicking Acknowledge removes the button for that alert', async () => {
    renderWithProviders(<Alerts />);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /acknowledge/i }).length).toBe(2);
    });

    const btns = screen.getAllByRole('button', { name: /acknowledge/i });
    await user.click(btns[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /acknowledge/i }).length).toBe(1);
    });
  });
});
