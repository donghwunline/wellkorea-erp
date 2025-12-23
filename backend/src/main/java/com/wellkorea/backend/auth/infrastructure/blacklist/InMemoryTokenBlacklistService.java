package com.wellkorea.backend.auth.infrastructure.blacklist;

import com.wellkorea.backend.auth.application.TokenBlacklistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory implementation of TokenBlacklistService.
 * Uses ConcurrentHashMap for thread-safe operations.
 *
 * <p><b>Limitations:</b>
 * <ul>
 *     <li>Not distributed - won't work across multiple server instances</li>
 *     <li>No TTL - blacklisted tokens remain until server restart</li>
 *     <li>Unbounded growth - consider cleanup for long-running servers</li>
 * </ul>
 *
 * <p><b>Suitable for:</b>
 * <ul>
 *     <li>Development and testing</li>
 *     <li>Single-instance deployments</li>
 *     <li>Proof-of-concept implementations</li>
 * </ul>
 *
 * <p><b>Production recommendation:</b> Replace with Redis-backed implementation
 * that includes TTL matching token expiration for proper cleanup.
 *
 * @see TokenBlacklistService
 */
@Service
public class InMemoryTokenBlacklistService implements TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(InMemoryTokenBlacklistService.class);

    private final Set<String> blacklistedTokens = ConcurrentHashMap.newKeySet();

    @Override
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) {
            log.warn("Attempted to blacklist null or blank token");
            return;
        }
        blacklistedTokens.add(token);
        log.debug("Token blacklisted, total blacklisted tokens: {}", blacklistedTokens.size());
    }

    @Override
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        return blacklistedTokens.contains(token);
    }

    @Override
    public void clearAll() {
        blacklistedTokens.clear();
        log.debug("Token blacklist cleared");
    }
}
