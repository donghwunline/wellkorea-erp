/**
 * Core types for the API layer.
 * Defines interfaces for tokens, errors, and HTTP responses.
 */

/**
 * Token pair for authentication.
 */
export interface Tokens {
  accessToken: string;
  refreshToken: string | null;
}

/**
 * Token storage interface for dependency injection.
 */
export interface TokenStore {
  getTokens(): Tokens | null;
  setTokens(tokens: Tokens): void;
  clear(): void;
}

/**
 * Normalized API error structure.
 */
export interface ApiError {
  status: number;
  errorCode?: string;
  message: string;
  details?: unknown;
}
