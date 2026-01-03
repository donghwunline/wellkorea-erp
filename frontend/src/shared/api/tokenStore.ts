/**
 * Token storage abstraction that wraps existing authStorage.
 * Provides a clean interface for HttpClient to manage tokens.
 *
 * Features:
 * - SSR/test safe (delegates to authStorage)
 * - Single responsibility (token management only)
 * - Easy to mock in tests
 */

import { authStorage } from '@/shared/lib';
import type { Tokens, TokenStore } from './types';

/**
 * Default token store implementation using authStorage.
 * Reuses existing localStorage abstraction with memory fallback.
 */
export const tokenStore: TokenStore = {
  getTokens(): Tokens | null {
    const accessToken = authStorage.getAccessToken();
    const refreshToken = authStorage.getRefreshToken();

    if (!accessToken) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
    };
  },

  setTokens(tokens: Tokens): void {
    authStorage.setAccessToken(tokens.accessToken);
    authStorage.setRefreshToken(tokens.refreshToken);
  },

  clear(): void {
    authStorage.clearAuth();
  },
};
