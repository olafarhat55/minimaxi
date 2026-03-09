import { describe, it, expect } from 'vitest';
import { mockApi } from '../../services/mockApi';

describe('machines – mockApi', () => {
  it('getMachines returns all 6 machines with no filters', async () => {
    const machines = await mockApi.getMachines();
    expect(machines.length).toBe(6);
  });

  it('getMachines filters by status=critical returns 1 machine', async () => {
    const critical = await mockApi.getMachines({ status: 'critical' });
    expect(critical.length).toBe(1);
    expect(critical[0].asset_id).toBe('ENGINE-012');
  });

  it('getMachines filters by status=warning returns 2 machines', async () => {
    const warning = await mockApi.getMachines({ status: 'warning' });
    expect(warning.length).toBe(2);
    warning.forEach((m) => expect(m.status).toBe('warning'));
  });

  it('getMachines filters by type=Pump returns 1 machine', async () => {
    const pumps = await mockApi.getMachines({ type: 'Pump' });
    expect(pumps.length).toBe(1);
    expect(pumps[0].asset_id).toBe('PUMP-023');
  });

  it('getMachines search for "CNC" returns 2 machines', async () => {
    const result = await mockApi.getMachines({ search: 'CNC' });
    expect(result.length).toBe(2);
    result.forEach((m) => expect(m.name.toLowerCase()).toContain('cnc'));
  });

  it('getMachines search is case-insensitive', async () => {
    const lower = await mockApi.getMachines({ search: 'cnc' });
    const upper = await mockApi.getMachines({ search: 'CNC' });
    expect(lower.length).toBe(upper.length);
  });

  it('getMachines filters by location', async () => {
    const lineA = await mockApi.getMachines({ location: 'Line A' });
    expect(lineA.length).toBeGreaterThan(0);
    lineA.forEach((m) => expect(m.location).toBe('Line A'));
  });

  it('getMachineById returns the correct machine', async () => {
    const machine = await mockApi.getMachineById(1);
    expect(machine.id).toBe(1);
    expect(machine.asset_id).toBe('CNC-001');
  });

  it('getMachineById throws for unknown id', async () => {
    await expect(mockApi.getMachineById(9999)).rejects.toThrow('Machine not found');
  });

  it('createMachine adds a new machine and resolves ID collision', async () => {
    const created = await mockApi.createMachine({
      name: 'Test Motor',
      type: 'Motor',
      location: 'Line C',
      serial_number: 'TST001',
      manufacturer: 'Test Co',
      model: 'M-100',
      installation_date: '2026-01-01',
      criticality: 'low',
    });

    expect(created.id).toBeGreaterThan(6); // ID > existing max
    expect(created.status).toBe('healthy');
    expect(created.prediction.failure_probability).toBe(5);

    // Ensure the new machine appears in the list
    const all = await mockApi.getMachines();
    expect(all.some((m) => m.id === created.id)).toBe(true);
  });
});
