import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MachinesList from '../../pages/app/MachinesList';
import { renderWithProviders, seedAuth, clearAuth, mockAdminUser, mockEngineerUser } from '../utils';

describe('MachinesList – UI', () => {
  const user = userEvent.setup({ delay: null });

  beforeEach(() => {
    seedAuth(mockAdminUser);
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders the Assets heading', async () => {
    renderWithProviders(<MachinesList />);
    expect(await screen.findByText('Assets')).toBeInTheDocument();
  });

  it('displays all 6 machines after loading', async () => {
    renderWithProviders(<MachinesList />);
    // Wait for data — each machine row has an asset ID
    await waitFor(() => {
      expect(screen.getByText('CNC-001')).toBeInTheDocument();
    });
    expect(screen.getByText('PUMP-023')).toBeInTheDocument();
    expect(screen.getByText('ENGINE-012')).toBeInTheDocument();
    expect(screen.getByText('COMP-007')).toBeInTheDocument();
    expect(screen.getByText('CNC-002')).toBeInTheDocument();
    expect(screen.getByText('ENGINE-015')).toBeInTheDocument();
  });

  it('shows "Add Asset" button for admin', async () => {
    renderWithProviders(<MachinesList />);
    await screen.findByText('Assets'); // wait for render
    expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
  });

  it('does NOT show "Add Asset" button for engineer', async () => {
    clearAuth();
    seedAuth(mockEngineerUser);
    renderWithProviders(<MachinesList />);
    await screen.findByText('Assets');
    expect(screen.queryByRole('button', { name: /add asset/i })).not.toBeInTheDocument();
  });

  it('searching "CNC" hides Hydraulic Pump and shows CNC machines', async () => {
    renderWithProviders(<MachinesList />);
    // Wait for initial data
    await waitFor(() => expect(screen.getByText('CNC-001')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/search assets/i);
    await user.type(searchInput, 'CNC');

    // Wait until both conditions are true at the same time:
    // - PUMP-023 hidden (filtered out)
    // - CNC-001 visible (CNC results loaded)
    // Using a single waitFor avoids a race with the loading skeleton between fetches.
    await waitFor(
      () => {
        expect(screen.queryByText('PUMP-023')).not.toBeInTheDocument();
        expect(screen.getByText('CNC-001')).toBeInTheDocument();
        expect(screen.getByText('CNC-002')).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('filter by status "Critical" shows only ENGINE-012', async () => {
    renderWithProviders(<MachinesList />);
    await waitFor(() => expect(screen.getByText('ENGINE-012')).toBeInTheDocument());

    // Open the Risk Level dropdown and select Critical
    const riskSelect = screen.getByLabelText(/risk level/i);
    await user.click(riskSelect);
    const criticalOption = await screen.findByRole('option', { name: /critical/i });
    await user.click(criticalOption);

    await waitFor(() => {
      expect(screen.getByText('ENGINE-012')).toBeInTheDocument();
      expect(screen.queryByText('CNC-001')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no results match', async () => {
    renderWithProviders(<MachinesList />);
    await waitFor(() => expect(screen.getByText('CNC-001')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/search assets/i);
    await user.type(searchInput, 'ZZZNOMATCH99999');

    await waitFor(
      () => {
        expect(screen.getByText(/no assets found/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
