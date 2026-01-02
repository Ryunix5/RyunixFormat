import bcrypt from 'bcryptjs';

// Simple client-side JWT-like token (note: in production, use proper JWT library)
export interface AuthToken {
  userId: string;
  username: string;
  isAdmin: boolean;
  exp: number;
}

const TOKEN_KEY = 'yugioh_auth_token';
const TOKEN_EXPIRY_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createAuthToken(userId: string, username: string, isAdmin: boolean): string {
  const token: AuthToken = {
    userId,
    username,
    isAdmin,
    exp: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };
  return btoa(JSON.stringify(token));
}

export function getAuthToken(): AuthToken | null {
  const tokenStr = localStorage.getItem(TOKEN_KEY);
  if (!tokenStr) return null;

  try {
    const token: AuthToken = JSON.parse(atob(tokenStr));
    if (token.exp < Date.now()) {
      clearAuthToken();
      return null;
    }
    
    // Auto-refresh token if it's more than 7 days old
    const tokenAge = Date.now() - (token.exp - TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (tokenAge > sevenDaysInMs) {
      // Refresh the token by extending expiry
      const refreshedToken = createAuthToken(token.userId, token.username, token.isAdmin);
      setAuthToken(refreshedToken);
      return JSON.parse(atob(refreshedToken));
    }
    
    return token;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

export function isAdmin(): boolean {
  const token = getAuthToken();
  return token?.isAdmin ?? false;
}
