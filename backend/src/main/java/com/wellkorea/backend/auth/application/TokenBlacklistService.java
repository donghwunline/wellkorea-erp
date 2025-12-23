package com.wellkorea.backend.auth.application;

/**
 * Service for managing blacklisted JWT tokens.
 * Tokens are blacklisted upon logout to prevent reuse.
 *
 * <p>This interface abstracts the storage mechanism to enable different implementations:
 * <ul>
 *     <li>In-memory (development/testing) - {@link com.wellkorea.backend.auth.infrastructure.blacklist.InMemoryTokenBlacklistService}</li>
 *     <li>Redis (production) - future implementation for distributed environments</li>
 *     <li>Database - alternative for persistence across restarts</li>
 * </ul>
 *
 * <p>Usage:
 * <pre>
 * // In AuthenticationService.logout():
 * tokenBlacklistService.blacklistToken(token);
 *
 * // In JwtAuthenticationFilter:
 * if (tokenBlacklistService.isBlacklisted(token)) {
 *     throw new InvalidJwtAuthenticationException("Token has been invalidated");
 * }
 * </pre>
 *
 * <p><b>Production Note:</b> The default in-memory implementation is not suitable for
 * production deployments with multiple instances. Implement a Redis-backed version
 * with TTL matching token expiration for horizontal scaling.
 */
public interface TokenBlacklistService {

    /**
     * Add a token to the blacklist.
     * Called when a user logs out to prevent token reuse.
     *
     * @param token the JWT token to blacklist
     */
    void blacklistToken(String token);

    /**
     * Check if a token is blacklisted.
     * Called by JwtAuthenticationFilter on every authenticated request.
     *
     * @param token the JWT token to check
     * @return true if the token is blacklisted (logged out)
     */
    boolean isBlacklisted(String token);

    /**
     * Clear all blacklisted tokens.
     * Primarily used for testing to reset state between test cases.
     * In production, this should be a no-op or protected operation.
     */
    void clearAll();
}
