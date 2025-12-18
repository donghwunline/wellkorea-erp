package com.wellkorea.backend.shared.ratelimit;

/**
 * Interface for rate limiting operations.
 * Abstracts the rate limiting implementation to allow migration from
 * in-memory (Bucket4j + Caffeine) to distributed (Redis) storage.
 * <p>
 * Implementations:
 * - {@link InMemoryRateLimiter}: Uses Bucket4j with Caffeine cache (single instance)
 * - Future: RedisRateLimiter for distributed rate limiting across multiple instances
 */
public interface RateLimiter {

    /**
     * Attempt to consume a token for the given key.
     *
     * @param key Unique identifier for rate limiting (e.g., IP address, user ID)
     * @return {@code true} if request is allowed, {@code false} if rate limit exceeded
     */
    boolean tryConsume(String key);

    /**
     * Get the number of seconds until the rate limit resets for the given key.
     *
     * @param key Unique identifier for rate limiting
     * @return Seconds until rate limit resets, or 0 if not rate limited
     */
    long getSecondsUntilReset(String key);

    /**
     * Clear the rate limit state for a specific key.
     * Primarily intended for testing purposes.
     *
     * @param key The key to clear
     */
    void clear(String key);

    /**
     * Clear all rate limit state.
     * Primarily intended for testing purposes.
     */
    void clearAll();
}
