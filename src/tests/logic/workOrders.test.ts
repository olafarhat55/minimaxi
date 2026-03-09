import { describe, it, expect } from 'vitest';
import { mockApi } from '../../services/mockApi';

describe('workOrders – mockApi', () => {
  it('getWorkOrders returns all work orders', async () => {
    const orders = await mockApi.getWorkOrders();
    expect(orders.length).toBeGreaterThanOrEqual(4);
  });

  it('getWorkOrders filters by status=open', async () => {
    const open = await mockApi.getWorkOrders({ status: 'open' });
    expect(open.length).toBeGreaterThan(0);
    open.forEach((wo) => expect(wo.status).toBe('open'));
  });

  it('getWorkOrders filters by priority=critical', async () => {
    const critical = await mockApi.getWorkOrders({ priority: 'critical' });
    expect(critical.length).toBeGreaterThan(0);
    critical.forEach((wo) => expect(wo.priority).toBe('critical'));
  });

  it('getWorkOrderById returns the correct work order', async () => {
    const wo = await mockApi.getWorkOrderById(101);
    expect(wo.id).toBe(101);
    expect(wo.wo_number).toBe('WO-2026-101');
  });

  it('getWorkOrderById throws for unknown id', async () => {
    await expect(mockApi.getWorkOrderById(9999)).rejects.toThrow('Work order not found');
  });

  it('createWorkOrder generates a valid WO number and defaults status to open', async () => {
    const created = await mockApi.createWorkOrder({
      machine_id: 1,
      title: 'Test maintenance',
      priority: 'low',
      description: 'Created by test',
    });

    expect(created.wo_number).toMatch(/^WO-\d{4}-\d+$/);
    expect(created.status).toBe('open');
    expect(created.title).toBe('Test maintenance');
    expect(created.notes).toEqual([]);
  });

  it('updateWorkOrder updates the status', async () => {
    const updated = await mockApi.updateWorkOrder(102, { status: 'in_progress' });
    expect(updated.status).toBe('in_progress');
    expect(updated.id).toBe(102);
  });

  it('addWorkOrderNote appends a note', async () => {
    const note = await mockApi.addWorkOrderNote(104, {
      user: 'Test User',
      text: 'Note from test',
    });
    expect(note.user).toBe('Test User');
    expect(note.text).toBe('Note from test');
    expect(note.id).toBeDefined();

    // Verify the note appears on the work order
    const wo = await mockApi.getWorkOrderById(104);
    expect(wo.notes.some((n: any) => n.text === 'Note from test')).toBe(true);
  });
});
