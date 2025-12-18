package com.wellkorea.backend.shared.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.EstimationProbe;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * In-memory rate limiter implementation using Bucket4j with Caffeine cache.
 * <p>
 * Configuration:
 * - 5 requests per minute per key (IP address)
 * - Buckets expire after 10 minutes of inactivity
 * <p>
 * Limitations:
 * - Single instance only (not suitable for clustered deployments)
 * - Rate limits reset on server restart
 * <p>
 * For distributed deployments, implement {@link RateLimiter} with Redis backend.
 */
@Component
public class InMemoryRateLimiter implements RateLimiter {

    private static final int MAX_REQUESTS = 5;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(1);
    private static final int CACHE_EXPIRY_MINUTES = 10;

    private final Cache<String, Bucket> bucketCache;

    public InMemoryRateLimiter() {
        this.bucketCache = Caffeine.newBuilder()
                .expireAfterAccess(CACHE_EXPIRY_MINUTES, TimeUnit.MINUTES)
                .build();
    }

    @Override
    public boolean tryConsume(String key) {
        Bucket bucket = bucketCache.get(key, this::createBucket);
        return bucket.tryConsume(1);
    }

    @Override
    public long getSecondsUntilReset(String key) {
        Bucket bucket = bucketCache.getIfPresent(key);
        if (bucket == null) {
            return 0;
        }

        // Use estimateAbilityToConsume to check without actually consuming tokens
        EstimationProbe probe = bucket.estimateAbilityToConsume(1);
        if (probe.canBeConsumed()) {
            return 0;
        }
        return TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill());
    }

    @Override
    public void clear(String key) {
        bucketCache.invalidate(key);
    }

    @Override
    public void clearAll() {
        bucketCache.invalidateAll();
    }

    private Bucket createBucket(String key) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(MAX_REQUESTS)
                .refillGreedy(MAX_REQUESTS, REFILL_PERIOD)
                .build();

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
