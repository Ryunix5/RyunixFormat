import { describe, it, expect } from 'vitest';
import { UserORM } from '@/sdk/database/orm/orm_user';

describe('User creation', () => {
  it('should create a user with valid coin', async () => {
    const userORM = UserORM.getInstance();
    const username = `test_user_${Date.now()}`;
    const resp = await userORM.insertUser([{ username, password_hash: 'xx', coin: 0, is_admin: false } as any]);
    expect(resp.length).toBeGreaterThan(0);
    expect(resp[0].username).toBe(username);
  });
});