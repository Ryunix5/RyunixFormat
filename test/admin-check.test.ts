import { describe, it, expect } from 'vitest';
import { initializeAdminUser } from '@/lib/init-admin';
import { getUserByUsername } from '@/lib/db';

describe('admin check', () => {
  it('should create or find admin', async () => {
    await initializeAdminUser();
    const admin = await getUserByUsername('admin');
    console.log('admin row:', admin);
    expect(admin).not.toBeNull();
    expect(admin!.username).toBe('admin');
    expect(typeof admin!.password_hash).toBe('string');
  });
});