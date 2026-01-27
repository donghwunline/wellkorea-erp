package com.wellkorea.backend.shared.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.integration.jdbc.lock.JdbcLockRegistry;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.function.Supplier;

/**
 * Service for acquiring distributed locks during mail token refresh.
 * Prevents race conditions when multiple instances try to refresh tokens simultaneously.
 *
 * <p>The lock is global (not per-config) since there's only one singleton config.
 * Uses the same {@link JdbcLockRegistry} as other lock services for consistency.
 *
 * @see com.wellkorea.backend.shared.lock.QuotationLockService
 * @see com.wellkorea.backend.shared.lock.LockRegistryConfig
 */
@Service
public class MailTokenLockService {

    private static final Logger log = LoggerFactory.getLogger(MailTokenLockService.class);

    /**
     * Lock key for mail token refresh operations.
     * Global lock since there's only one singleton mail config.
     */
    private static final String MAIL_REFRESH_LOCK = "mail:refresh-token";

    /**
     * Default timeout for acquiring the lock (in seconds).
     * Short timeout since token refresh should be quick.
     */
    private static final long DEFAULT_LOCK_TIMEOUT_SECONDS = 5;

    private final JdbcLockRegistry lockRegistry;

    public MailTokenLockService(JdbcLockRegistry lockRegistry) {
        this.lockRegistry = lockRegistry;
    }

    /**
     * Execute an action while holding the mail token refresh lock.
     * Used when refreshing access tokens to prevent concurrent refresh attempts.
     *
     * @param action The action to execute while holding the lock
     * @param <T> Return type of the action
     * @return The result of the action
     * @throws MailSendException if the lock cannot be acquired within timeout
     */
    public <T> T executeWithLock(Supplier<T> action) {
        Lock lock = lockRegistry.obtain(MAIL_REFRESH_LOCK);

        log.debug("Attempting to acquire mail token refresh lock");

        boolean acquired;
        try {
            acquired = lock.tryLock(DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new MailSendException("Interrupted while waiting for token refresh lock", e);
        }

        if (!acquired) {
            log.warn("Failed to acquire mail token refresh lock within {} seconds", DEFAULT_LOCK_TIMEOUT_SECONDS);
            throw new MailSendException("Another token refresh is in progress. Please try again.");
        }

        log.debug("Mail token refresh lock acquired");
        try {
            return action.get();
        } finally {
            lock.unlock();
            log.debug("Mail token refresh lock released");
        }
    }
}
