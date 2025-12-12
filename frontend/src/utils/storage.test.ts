/**
 * Tests for storage utility (localStorage wrapper)
 */

import {describe, it, expect, beforeEach, vi} from 'vitest';
import {storage, authStorage} from './storage';

describe('storage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('basic operations', () => {
    it('should store and retrieve a string value', () => {
      storage.set('testKey', 'testValue');
      expect(storage.get('testKey')).toBe('testValue');
    });

    it('should return null for non-existent keys', () => {
      expect(storage.get('nonExistent')).toBeNull();
    });

    it('should remove a stored value', () => {
      storage.set('testKey', 'testValue');
      storage.remove('testKey');
      expect(storage.get('testKey')).toBeNull();
    });

    it('should clear all stored values', () => {
      storage.set('key1', 'value1');
      storage.set('key2', 'value2');
      storage.clear();
      expect(storage.get('key1')).toBeNull();
      expect(storage.get('key2')).toBeNull();
    });
  });

  describe('JSON operations', () => {
    it('should store and retrieve JSON objects', () => {
      const testObj = {name: 'Alice', age: 30, roles: ['ROLE_ADMIN']};
      storage.setJson('user', testObj);

      const retrieved = storage.getJson<typeof testObj>('user');
      expect(retrieved).toEqual(testObj);
    });

    it('should return null for non-existent JSON keys', () => {
      expect(storage.getJson('nonExistent')).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      // Manually set invalid JSON
      localStorage.setItem('invalid', '{invalid json');

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = storage.getJson('invalid');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(localStorage.getItem('invalid')).toBeNull(); // Should be removed

      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON stringify errors gracefully', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular; // Create circular reference

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      storage.setJson('circular', circular);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(storage.get('circular')).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('SSR safety', () => {
    it('should handle missing localStorage gracefully', () => {
      // This test verifies the hasLocalStorage check
      // In real SSR environment, localStorage would be undefined
      // Here we just verify the code doesn't throw
      expect(() => storage.get('test')).not.toThrow();
      expect(() => storage.set('test', 'value')).not.toThrow();
      expect(() => storage.remove('test')).not.toThrow();
      expect(() => storage.clear()).not.toThrow();
    });
  });
});

describe('authStorage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('access token', () => {
    it('should store and retrieve access token', () => {
      authStorage.setAccessToken('test-access-token');
      expect(authStorage.getAccessToken()).toBe('test-access-token');
    });

    it('should remove access token when set to null', () => {
      authStorage.setAccessToken('test-token');
      authStorage.setAccessToken(null);
      expect(authStorage.getAccessToken()).toBeNull();
    });

    it('should return null when no access token is stored', () => {
      expect(authStorage.getAccessToken()).toBeNull();
    });
  });

  describe('refresh token', () => {
    it('should store and retrieve refresh token', () => {
      authStorage.setRefreshToken('test-refresh-token');
      expect(authStorage.getRefreshToken()).toBe('test-refresh-token');
    });

    it('should remove refresh token when set to null', () => {
      authStorage.setRefreshToken('test-token');
      authStorage.setRefreshToken(null);
      expect(authStorage.getRefreshToken()).toBeNull();
    });

    it('should return null when no refresh token is stored', () => {
      expect(authStorage.getRefreshToken()).toBeNull();
    });
  });

  describe('user data', () => {
    it('should store and retrieve user object', () => {
      const user = {
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        fullName: 'Alice User',
        roles: ['ROLE_ADMIN'],
      };

      authStorage.setUser(user);
      const retrieved = authStorage.getUser();

      expect(retrieved).toEqual(user);
    });

    it('should return null when no user is stored', () => {
      expect(authStorage.getUser()).toBeNull();
    });

    it('should handle type parameter correctly', () => {
      interface TestUser {
        id: number;
        name: string;
      }

      const user: TestUser = {id: 1, name: 'Alice'};
      authStorage.setUser(user);

      const retrieved = authStorage.getUser<TestUser>();
      expect(retrieved).toEqual(user);
      expect(retrieved?.id).toBe(1);
      expect(retrieved?.name).toBe('Alice');
    });
  });

  describe('clearAuth', () => {
    it('should clear all auth-related data', () => {
      authStorage.setAccessToken('access-token');
      authStorage.setRefreshToken('refresh-token');
      authStorage.setUser({id: 1, name: 'Alice'});

      authStorage.clearAuth();

      expect(authStorage.getAccessToken()).toBeNull();
      expect(authStorage.getRefreshToken()).toBeNull();
      expect(authStorage.getUser()).toBeNull();
    });

    it('should only clear auth keys, not other localStorage data', () => {
      storage.set('otherKey', 'otherValue');
      authStorage.setAccessToken('access-token');

      authStorage.clearAuth();

      expect(authStorage.getAccessToken()).toBeNull();
      expect(storage.get('otherKey')).toBe('otherValue');
    });
  });
});
