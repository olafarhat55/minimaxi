import { describe, it, expect } from 'vitest';
import { mockApi } from '../../services/mockApi';

describe('alerts – mockApi', () => {
  it('getAlerts returns all 4 alerts', async () => {
    const alerts = await mockApi.getAlerts();
    expect(alerts.length).toBe(4);
  });

  it('getAlerts returns results sorted by created_at descending', async () => {
    const alerts = await mockApi.getAlerts();
    for (let i = 0; i < alerts.length - 1; i++) {
      const a = new Date(alerts[i].created_at).getTime();
      const b = new Date(alerts[i + 1].created_at).getTime();
      expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it('getAlerts with acknowledged=false returns 2 unacknowledged alerts', async () => {
    const unread = await mockApi.getAlerts({ acknowledged: false });
    expect(unread.length).toBe(2);
    unread.forEach((a) => expect(a.acknowledged).toBe(false));
  });

  it('getAlerts with acknowledged=true returns 2 acknowledged alerts', async () => {
    const read = await mockApi.getAlerts({ acknowledged: true });
    expect(read.length).toBe(2);
    read.forEach((a) => expect(a.acknowledged).toBe(true));
  });

  it('getAlerts filters by severity=critical', async () => {
    const critical = await mockApi.getAlerts({ severity: 'critical' });
    expect(critical.length).toBeGreaterThan(0);
    critical.forEach((a) => expect(a.severity).toBe('critical'));
  });

  it('acknowledgeAlert marks the alert as acknowledged', async () => {
    const updated = await mockApi.acknowledgeAlert(3, 'Test Technician');
    expect(updated.acknowledged).toBe(true);
    expect(updated.acknowledged_by).toBe('Test Technician');
    expect(updated.acknowledged_at).toBeDefined();
  });

  it('acknowledgeAlert throws for unknown id', async () => {
    await expect(mockApi.acknowledgeAlert(9999, 'User')).rejects.toThrow('Alert not found');
  });
});
