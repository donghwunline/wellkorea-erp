/**
 * Unit tests for tokenStore.
 * Tests token storage abstraction layer that delegates to authStorage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tokenStore } from './tokenStore';

// Mock authStorage module
vi.mock('@/utils/storage', () => ({
  authStorage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

// Import mocked module
import { authStorage } from '@/utils/storage';

describe('tokenStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTokens', () => {
    it('should return tokens when both accessToken and refreshToken exist', () => {
      // Given: Both tokens exist in storage
      vi.mocked(authStorage.getAccessToken).mockReturnValue('access-token-123');
      vi.mocked(authStorage.getRefreshToken).mockReturnValue('refresh-token-456');

      // When: Get tokens
      const result = tokenStore.getTokens();

      // Then: Returns both tokens
      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      });
      expect(authStorage.getAccessToken).toHaveBeenCalledOnce();
      expect(authStorage.getRefreshToken).toHaveBeenCalledOnce();
    });

    it('should return tokens when accessToken exists but refreshToken is null', () => {
      // Given: Only accessToken exists
      vi.mocked(authStorage.getAccessToken).mockReturnValue('access-token-123');
      vi.mocked(authStorage.getRefreshToken).mockReturnValue(null);

      // When: Get tokens
      const result = tokenStore.getTokens();

      // Then: Returns accessToken with null refreshToken
      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: null,
      });
    });

    it('should return null when accessToken is null', () => {
      // Given: No accessToken (user not logged in)
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);
      vi.mocked(authStorage.getRefreshToken).mockReturnValue('refresh-token-456');

      // When: Get tokens
      const result = tokenStore.getTokens();

      // Then: Returns null (accessToken is required)
      expect(result).toBeNull();
      // Note: getRefreshToken is still called (implementation doesn't short-circuit)
      expect(authStorage.getRefreshToken).toHaveBeenCalledOnce();
    });

    it('should return null when accessToken is empty string', () => {
      // Given: Empty accessToken
      vi.mocked(authStorage.getAccessToken).mockReturnValue('');
      vi.mocked(authStorage.getRefreshToken).mockReturnValue('refresh-token-456');

      // When: Get tokens
      const result = tokenStore.getTokens();

      // Then: Returns null (empty string is falsy)
      expect(result).toBeNull();
    });

    it('should return null when both tokens are null', () => {
      // Given: No tokens in storage
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);
      vi.mocked(authStorage.getRefreshToken).mockReturnValue(null);

      // When: Get tokens
      const result = tokenStore.getTokens();

      // Then: Returns null
      expect(result).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('should delegate to authStorage when setting tokens', () => {
      // Given: Token pair
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      // When: Set tokens
      tokenStore.setTokens(tokens);

      // Then: Calls authStorage setters
      expect(authStorage.setAccessToken).toHaveBeenCalledOnce();
      expect(authStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(authStorage.setRefreshToken).toHaveBeenCalledOnce();
      expect(authStorage.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');
    });

    it('should handle null refreshToken', () => {
      // Given: Token pair with null refreshToken
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: null,
      };

      // When: Set tokens
      tokenStore.setTokens(tokens);

      // Then: Passes null to authStorage
      expect(authStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(authStorage.setRefreshToken).toHaveBeenCalledWith(null);
    });

    it('should set both tokens even if refreshToken is empty string', () => {
      // Given: Token pair with empty string refreshToken
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: '',
      };

      // When: Set tokens
      tokenStore.setTokens(tokens);

      // Then: Passes empty string to authStorage
      expect(authStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(authStorage.setRefreshToken).toHaveBeenCalledWith('');
    });
  });

  describe('clear', () => {
    it('should delegate to authStorage.clearAuth', () => {
      // When: Clear tokens
      tokenStore.clear();

      // Then: Calls clearAuth (removes accessToken, refreshToken, user)
      expect(authStorage.clearAuth).toHaveBeenCalledOnce();
    });

    it('should not call individual remove methods', () => {
      // When: Clear tokens
      tokenStore.clear();

      // Then: Only calls clearAuth (not individual setters)
      expect(authStorage.clearAuth).toHaveBeenCalledOnce();
      expect(authStorage.setAccessToken).not.toHaveBeenCalled();
      expect(authStorage.setRefreshToken).not.toHaveBeenCalled();
    });
  });
});
