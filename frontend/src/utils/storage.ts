/**
 * Safe wrappers around localStorage and auth-related storage helpers.
 *
 * - Centralizes environment checks
 * - Avoids localStorage access sprinkled throughout the app
 * - Easy to mock in tests
 */

const hasLocalStorage = globalThis?.localStorage !== undefined;

export const storage = {
  get(key: string): string | null {
    if (!hasLocalStorage) return null;
    return globalThis.localStorage.getItem(key);
  },

  set(key: string, value: string): void {
    if (!hasLocalStorage) return;
    globalThis.localStorage.setItem(key, value);
  },

  remove(key: string): void {
    if (!hasLocalStorage) return;
    globalThis.localStorage.removeItem(key);
  },

  clear(): void {
    if (!hasLocalStorage) return;
    globalThis.localStorage.clear();
  },

  getJson<T>(key: string): T | null {
    const raw = this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`Failed to parse JSON from storage for key "${key}"`, error);
      this.remove(key);
      return null;
    }
  },

  setJson(key: string, value: unknown): void {
    if (!hasLocalStorage) return;
    try {
      const raw = JSON.stringify(value);
      this.set(key, raw);
    } catch (error) {
      console.error(`Failed to stringify JSON for storage key "${key}"`, error);
    }
  },
};

export const authStorage = {
  getAccessToken(): string | null {
    return storage.get('accessToken');
  },

  setAccessToken(token: string | null): void {
    if (token) {
      storage.set('accessToken', token);
    } else {
      storage.remove('accessToken');
    }
  },

  getRefreshToken(): string | null {
    return storage.get('refreshToken');
  },

  setRefreshToken(token: string | null): void {
    if (token) {
      storage.set('refreshToken', token);
    } else {
      storage.remove('refreshToken');
    }
  },

  getUser<T>(): T | null {
    return storage.getJson<T>('user');
  },

  setUser(value: unknown): void {
    storage.setJson('user', value);
  },

  clearAuth(): void {
    storage.remove('accessToken');
    storage.remove('refreshToken');
    storage.remove('user');
  },
};
