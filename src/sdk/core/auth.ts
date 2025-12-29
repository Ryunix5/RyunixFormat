import { create } from "zustand";

// Lightweight auth wrapper using the app's local token

/**
 * Minimal compatibility layer that exposes the functions used by the
 * internal SDK (getAuthTokenAsync, getAuthToken, isAuthenticatedSync, initializeAuthIntegration)
 * and is backed by the existing local token in localStorage (from `src/lib/auth.ts`).
 */

const TOKEN_KEY = "yugioh_auth_token";

export type AuthStatus = "loading" | "unauthenticated" | "authenticated" | "invalid_token";

export type AuthState = {
  token: string | null;
  status: AuthStatus;
  parentOrigin: string | null;
  setToken: (token: string | null, parentOrigin?: string | null) => Promise<void>;
  clearAuth: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  validateToken: (token: string) => Promise<boolean>;
};

const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  status: "loading",
  parentOrigin: null,

  setToken: async (token: string | null, parentOrigin: string | null = null) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      set({ token, status: "authenticated", parentOrigin });
    } else {
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, status: "unauthenticated", parentOrigin: null });
    }
  },

  clearAuth: async () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, status: "unauthenticated", parentOrigin: null });
  },

  validateToken: async (token: string) => {
    // Minimal validation: token exists. In the future this can call an introspection endpoint.
    return !!token && token.length > 0;
  },

  refreshAuth: async () => {
    const token = get().token || localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ status: "unauthenticated" });
      return false;
    }

    const valid = await get().validateToken(token);
    if (valid) {
      set({ status: "authenticated", token });
      return true;
    }
    set({ status: "invalid_token", token: null });
    localStorage.removeItem(TOKEN_KEY);
    return false;
  },
}));

let initialized = false;
async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    // set synchronously then validate in background
    await useAuthStore.getState().setToken(token, null);
    await useAuthStore.getState().refreshAuth();
  } else {
    // no stored token
    await useAuthStore.getState().clearAuth();
  }
}

export async function initializeAuthIntegration(): Promise<void> {
  // Nothing external to initialize, just ensure we load any stored token
  await ensureInitialized();
}

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

export async function getAuthTokenAsync(): Promise<string | null> {
  await ensureInitialized();
  return getAuthToken();
}

export function isAuthenticatedSync(): boolean {
  return !!getAuthToken();
}

/**
 * Check if auth is still loading
 */
export function isAuthenticating(): boolean {
  return useAuthStore.getState().status === "loading";
}

/**
 * Get the current auth state
 */
export function getAuthState(): AuthState {
  const { token, status, parentOrigin } = useAuthStore.getState();
  return { token, status, parentOrigin, setToken: useAuthStore.getState().setToken, clearAuth: useAuthStore.getState().clearAuth, refreshAuth: useAuthStore.getState().refreshAuth, validateToken: useAuthStore.getState().validateToken };
}

/**
 * Add a listener for auth state changes
 */
export function addAuthStateListener(listener: (state: AuthState) => void): () => void {
  // Immediately notify with current state
  const currentState = getAuthState();
  listener(currentState as AuthState);

  // Subscribe to store changes
  const unsubscribe = useAuthStore.subscribe((state) => {
    const { token, status, parentOrigin } = state;
    listener({ token, status, parentOrigin, setToken: state.setToken, clearAuth: state.clearAuth, refreshAuth: state.refreshAuth, validateToken: state.validateToken });
  });

  // Return cleanup function
  return unsubscribe as unknown as () => void;
}

/**
 * Clear authentication
 */
export async function clearAuth(): Promise<void> {
  return useAuthStore.getState().clearAuth();
}

/**
 * Refresh authentication state by re-validating the current token
 */
export async function refreshAuth(): Promise<boolean> {
  return useAuthStore.getState().refreshAuth();
}

/**
 * Decode JWT token payload
 * @param token - JWT token string
 * @returns Decoded payload object or null if decoding fails
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("Invalid JWT token format");
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Replace URL-safe characters and add padding if needed
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    // Decode base64 and parse JSON
    const decodedPayload = atob(paddedBase64);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.warn("Failed to decode JWT token:", error);
    return null;
  }
}

/**
 * Get user ID from the current authentication token
 * Extracts userId or sub field from JWT token payload
 * @returns User ID string or null if not available
 */
export function getUserId(): string | null {
  const token = useAuthStore.getState().token;

  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  // Try to get userId first, then fall back to sub
  return payload.userId || payload.sub || null;
}

/**
 * Get user ID from the current authentication token (async - ensures initialization)
 * Extracts userId or sub field from JWT token payload
 * @returns User ID string or null if not available
 */
export async function getUserIdAsync(): Promise<string | null> {
  await ensureInitialized();
  return getUserId();
}
