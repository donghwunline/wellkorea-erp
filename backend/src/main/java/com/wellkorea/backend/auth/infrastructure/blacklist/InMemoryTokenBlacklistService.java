package com.wellkorea.backend.auth.infrastructure.blacklist;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.wellkorea.backend.auth.application.TokenBlacklistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * In-memory implementation of TokenBlacklistService using Caffeine cache.
 * Provides thread-safe operations with automatic TTL-based expiration.
 *
 * <p><b>Features:</b>
 * <ul>
 *     <li>TTL-based expiration matching JWT token lifetime</li>
 *     <li>Maximum size limit to prevent unbounded memory growth</li>
 *     <li>Thread-safe Caffeine cache</li>
 * </ul>
 *
 * <p><b>Limitations:</b>
 * <ul>
 *     <li>Not distributed - won't work across multiple server instances</li>
 *     <li>Lost on server restart (blacklisted tokens become valid)</li>
 * </ul>
 *
 * <p><b>Suitable for:</b>
 * <ul>
 *     <li>Development and testing</li>
 *     <li>Single-instance deployments</li>
 * </ul>
 *
 * <p><b>Production recommendation:</b> Replace with Redis-backed implementation
 * for distributed deployments and persistence across restarts.
 *
 * @see TokenBlacklistService
 */
@Service
public class InMemoryTokenBlacklistService implements TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(InMemoryTokenBlacklistService.class);
    private static final int MAX_BLACKLISTED_TOKENS = 100_000;

    private final Cache<String, Boolean> blacklistedTokens;

    public InMemoryTokenBlacklistService(@Value("${jwt.expiration}") long jwtExpirationMs) {
        this.blacklistedTokens = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMillis(jwtExpirationMs))
                .maximumSize(MAX_BLACKLISTED_TOKENS)
                .build();
        log.info("Token blacklist initialized with TTL={}ms, maxSize={}",
                jwtExpirationMs, MAX_BLACKLISTED_TOKENS);
    }

    @Override
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) {
            log.warn("Attempted to blacklist null or blank token");
            return;
        }
        blacklistedTokens.put(token, Boolean.TRUE);
        log.debug("Token blacklisted, estimated blacklisted tokens: {}", blacklistedTokens.estimatedSize());
    }

    @Override
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        return blacklistedTokens.getIfPresent(token) != null;
    }

    @Override
    public void clearAll() {
        blacklistedTokens.invalidateAll();
        log.debug("Token blacklist cleared");
    }
}
