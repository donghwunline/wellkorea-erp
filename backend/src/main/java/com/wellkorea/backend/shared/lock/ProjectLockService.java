package com.wellkorea.backend.shared.lock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.integration.jdbc.lock.JdbcLockRegistry;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.function.Supplier;

/**
 * Service for acquiring project-level distributed locks.
 * <p>
 * Provides a clean template API that separates locking concerns from business logic.
 * Similar in pattern to {@link com.wellkorea.backend.shared.audit.AuditLogger} -
 * a dedicated service for cross-cutting infrastructure concerns.
 *
 * <h2>Usage Example</h2>
 * <pre>
 * // In DeliveryCommandService
 * public Long createDelivery(Long projectId, CreateDeliveryRequest request, Long userId) {
 *     return projectLockService.executeWithLock(projectId, () -> {
 *         // Pure business logic - no locking awareness needed
 *         Quotation quotation = findApprovedQuotation(projectId);
 *         validateDeliveryQuantities(quotation, request);
 *         return saveDelivery(projectId, request, userId);
 *     });
 * }
 * </pre>
 *
 * <h2>Lock Behavior</h2>
 * <ul>
 *   <li>Locks are per-project with key format: {@code project:{projectId}}</li>
 *   <li>Lock acquisition timeout: 5 seconds (configurable)</li>
 *   <li>Lock TTL: 30 seconds (prevents deadlocks if process crashes)</li>
 *   <li>Backend: PostgreSQL via Spring Integration JdbcLockRegistry</li>
 * </ul>
 *
 * @see LockRegistryConfig
 */
@Service
public class ProjectLockService {

    private static final Logger log = LoggerFactory.getLogger(ProjectLockService.class);

    /**
     * Lock key prefix for project-level locks.
     */
    private static final String PROJECT_LOCK_PREFIX = "project:";

    /**
     * Default timeout for acquiring a lock (in seconds).
     */
    private static final long DEFAULT_LOCK_TIMEOUT_SECONDS = 5;

    private final JdbcLockRegistry lockRegistry;

    public ProjectLockService(JdbcLockRegistry lockRegistry) {
        this.lockRegistry = lockRegistry;
    }

    /**
     * Execute an action while holding an exclusive lock on the project.
     * <p>
     * This method:
     * <ol>
     *   <li>Attempts to acquire a lock for the given project ID</li>
     *   <li>If successful, executes the provided action</li>
     *   <li>Releases the lock after completion (success or failure)</li>
     * </ol>
     *
     * @param projectId The project ID to lock
     * @param action    The action to execute while holding the lock
     * @param <T>       Return type of the action
     * @return The result of the action
     * @throws LockAcquisitionException if the lock cannot be acquired within timeout
     * @throws RuntimeException         if the action throws an exception (lock is still released)
     */
    public <T> T executeWithLock(Long projectId, Supplier<T> action) {
        return executeWithLock(projectId, action, DEFAULT_LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    /**
     * Execute an action while holding an exclusive lock on the project with custom timeout.
     *
     * @param projectId The project ID to lock
     * @param action    The action to execute while holding the lock
     * @param timeout   The maximum time to wait for the lock
     * @param unit      The time unit of the timeout
     * @param <T>       Return type of the action
     * @return The result of the action
     * @throws LockAcquisitionException if the lock cannot be acquired within timeout
     */
    public <T> T executeWithLock(Long projectId, Supplier<T> action, long timeout, TimeUnit unit) {
        String lockKey = PROJECT_LOCK_PREFIX + projectId;
        Lock lock = lockRegistry.obtain(lockKey);

        log.debug("Attempting to acquire lock: {}", lockKey);

        boolean acquired;
        try {
            acquired = lock.tryLock(timeout, unit);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new LockAcquisitionException(
                    "Interrupted while waiting for lock on project " + projectId, e);
        }

        if (!acquired) {
            log.warn("Failed to acquire lock within timeout: {} (timeout: {} {})",
                    lockKey, timeout, unit);
            throw new LockAcquisitionException(
                    "Another operation is in progress for project " + projectId + ". Please try again.");
        }

        log.debug("Lock acquired: {}", lockKey);
        try {
            return action.get();
        } finally {
            lock.unlock();
            log.debug("Lock released: {}", lockKey);
        }
    }

    /**
     * Execute a void action while holding an exclusive lock on the project.
     *
     * @param projectId The project ID to lock
     * @param action    The action to execute while holding the lock
     * @throws LockAcquisitionException if the lock cannot be acquired within timeout
     */
    public void executeWithLock(Long projectId, Runnable action) {
        executeWithLock(projectId, () -> {
            action.run();
            return null;
        });
    }
}
