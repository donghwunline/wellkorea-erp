package com.wellkorea.backend.shared.lock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.integration.jdbc.lock.JdbcLockRegistry;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.function.Supplier;

/**
 * Service for acquiring quotation-level distributed locks.
 * <p>
 * Provides a clean template API that separates locking concerns from business logic.
 * This is the preferred locking strategy for delivery and invoice operations because
 * validation is quotation-scoped (quotation line items, delivered/invoiced quantities).
 *
 * <h2>Usage Example</h2>
 * <pre>
 * // In DeliveryCommandService
 * public Long createDelivery(Long quotationId, CreateDeliveryRequest request, Long userId) {
 *     return quotationLockService.executeWithLock(quotationId, () -> {
 *         // Pure business logic - no locking awareness needed
 *         Quotation quotation = findQuotation(quotationId);
 *         validateDeliveryQuantities(quotation, request);
 *         return saveDelivery(quotation, request, userId);
 *     });
 * }
 * </pre>
 *
 * <h2>Lock Behavior</h2>
 * <ul>
 *   <li>Locks are per-quotation with key format: {@code quotation:{quotationId}}</li>
 *   <li>Lock acquisition timeout: 5 seconds (configurable)</li>
 *   <li>Lock TTL: 30 seconds (prevents deadlocks if process crashes)</li>
 *   <li>Backend: PostgreSQL via Spring Integration JdbcLockRegistry</li>
 * </ul>
 *
 * <h2>Why Quotation-Level Locking?</h2>
 * <ul>
 *   <li>Validation queries are quotation-scoped (quotation line items, delivered/invoiced quantities)</li>
 *   <li>More granular than project-level locking - different quotations can be processed concurrently</li>
 *   <li>Aligns with the domain model where deliveries and invoices are created against specific quotations</li>
 * </ul>
 *
 * @see LockRegistryConfig
 * @see QuotationLock
 * @see QuotationLockAspect
 */
@Service
public class QuotationLockService {

    private static final Logger log = LoggerFactory.getLogger(QuotationLockService.class);

    /**
     * Lock key prefix for quotation-level locks.
     */
    private static final String QUOTATION_LOCK_PREFIX = "quotation:";

    /**
     * Default timeout for acquiring a lock (in seconds).
     */
    private static final long DEFAULT_LOCK_TIMEOUT_SECONDS = 5;

    private final JdbcLockRegistry lockRegistry;

    public QuotationLockService(JdbcLockRegistry lockRegistry) {
        this.lockRegistry = lockRegistry;
    }

    /**
     * Execute an action while holding an exclusive lock on the quotation.
     * <p>
     * This method:
     * <ol>
     *   <li>Attempts to acquire a lock for the given quotation ID</li>
     *   <li>If successful, executes the provided action</li>
     *   <li>Releases the lock after completion (success or failure)</li>
     * </ol>
     *
     * @param quotationId The quotation ID to lock
     * @param action      The action to execute while holding the lock
     * @param <T>         Return type of the action
     * @return The result of the action
     * @throws LockAcquisitionException if the lock cannot be acquired within timeout
     * @throws RuntimeException         if the action throws an exception (lock is still released)
     */
    public <T> T executeWithLock(Long quotationId, Supplier<T> action) {
        return executeWithLock(quotationId, action, DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    /**
     * Execute an action while holding an exclusive lock on the quotation with custom timeout.
     *
     * @param quotationId The quotation ID to lock
     * @param action      The action to execute while holding the lock
     * @param timeout     The maximum time to wait for the lock
     * @param unit        The time unit of the timeout
     * @param <T>         Return type of the action
     * @return The result of the action
     * @throws LockAcquisitionException if the lock cannot be acquired within timeout
     */
    public <T> T executeWithLock(Long quotationId, Supplier<T> action, long timeout, TimeUnit unit) {
        String lockKey = QUOTATION_LOCK_PREFIX + quotationId;
        Lock lock = lockRegistry.obtain(lockKey);

        log.debug("Attempting to acquire quotation lock: {}", lockKey);

        boolean acquired;
        try {
            acquired = lock.tryLock(timeout, unit);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new LockAcquisitionException(
                    "Interrupted while waiting for lock on quotation " + quotationId, e);
        }

        if (!acquired) {
            log.warn("Failed to acquire quotation lock within timeout: {} (timeout: {} {})",
                    lockKey, timeout, unit);
            throw new LockAcquisitionException(
                    "Another operation is in progress for quotation " + quotationId + ". Please try again.");
        }

        log.debug("Quotation lock acquired: {}", lockKey);
        try {
            return action.get();
        } finally {
            lock.unlock();
            log.debug("Quotation lock released: {}", lockKey);
        }
    }

    /**
     * Execute a void action while holding an exclusive lock on the quotation.
     *
     * @param quotationId The quotation ID to lock
     * @param action      The action to execute while holding the lock
     * @throws LockAcquisitionException if the lock cannot be acquired within timeout
     */
    public void executeWithLock(Long quotationId, Runnable action) {
        executeWithLock(quotationId, () -> {
            action.run();
            return null;
        });
    }
}
