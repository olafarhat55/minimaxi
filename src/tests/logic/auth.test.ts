import { describe, it, expect } from 'vitest';
import { mockApi } from '../../services/mockApi';

describe('auth – mockApi', () => {
  it('returns user (without password) and a token on valid credentials', async () => {
    const result = await mockApi.login('admin@abc.com', 'admin123');

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('admin@abc.com');
    expect(result.user.role).toBe('admin');
    expect(result.user).not.toHaveProperty('password');
    expect(result.token).toMatch(/^mock-token-/);
  });

  it('throws on wrong password', async () => {
    await expect(
      mockApi.login('admin@abc.com', 'wrongpassword')
    ).rejects.toThrow('Invalid email or password');
  });

  it('throws on unknown email', async () => {
    await expect(
      mockApi.login('nobody@example.com', 'any')
    ).rejects.toThrow('Invalid email or password');
  });

  it('returns success on logout', async () => {
    const result = await mockApi.logout();
    expect(result.success).toBe(true);
  });

  it('engineer login resolves with correct role', async () => {
    const result = await mockApi.login('sara@abc.com', 'engineer123');
    expect(result.user.role).toBe('engineer');
    expect(result.user.name).toBe('Sara Ahmed');
  });

  it('technician login resolves with correct role', async () => {
    const result = await mockApi.login('khaled@abc.com', 'tech123');
    expect(result.user.role).toBe('technician');
  });
});
