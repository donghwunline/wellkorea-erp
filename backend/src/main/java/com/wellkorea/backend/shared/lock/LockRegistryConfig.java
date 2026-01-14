package com.wellkorea.backend.shared.lock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.jdbc.lock.DefaultLockRepository;
import org.springframework.integration.jdbc.lock.JdbcLockRegistry;
import org.springframework.integration.jdbc.lock.LockRepository;

import javax.sql.DataSource;

/**
 * Configuration for Spring Integration JDBC Lock Registry.
 * <p>
 * Provides distributed locking capabilities using PostgreSQL for coordination.
 * Used by {@link ProjectLockService} and {@link QuotationLockService} to prevent
 * race conditions during concurrent operations.
 * <p>
 * <b>Lock Key Prefixes:</b>
 * <ul>
 *   <li>{@code project:{id}} - Project-level locks (legacy, for operations without quotation context)</li>
 *   <li>{@code quotation:{id}} - Quotation-level locks (preferred for delivery/invoice operations)</li>
 * </ul>
 *
 * @see ProjectLockService
 * @see QuotationLockService
 * @see <a href="https://docs.spring.io/spring-integration/reference/jdbc.html#jdbc-lock-registry">
 * Spring Integration JDBC Lock Registry</a>
 */
@Configuration
public class LockRegistryConfig {

    /**
     * Lock time-to-live in milliseconds.
     * Locks older than this will be considered expired and can be acquired by other clients.
     * Set to 30 seconds to balance between:
     * - Allowing sufficient time for delivery validation
     * - Not blocking too long if a process crashes while holding a lock
     */
    private static final int LOCK_TTL_MS = 30_000;

    /**
     * Region name for project-related locks.
     * Provides namespace isolation for different lock types.
     */
    public static final String PROJECT_LOCK_REGION = "PROJECT";

    /**
     * Creates the lock repository that manages lock state in PostgreSQL.
     * Uses the INT_LOCK table created by Flyway migration V15.
     *
     * @param dataSource PostgreSQL DataSource
     * @return LockRepository for managing lock state
     */
    @Bean
    public LockRepository lockRepository(DataSource dataSource) {
        DefaultLockRepository repository = new DefaultLockRepository(dataSource);
        repository.setRegion(PROJECT_LOCK_REGION);
        repository.setTimeToLive(LOCK_TTL_MS);
        return repository;
    }

    /**
     * Creates the JdbcLockRegistry that provides the Lock interface.
     * <p>
     * Usage example:
     * <pre>
     * Lock lock = lockRegistry.obtain("project:123");
     * if (lock.tryLock(5, TimeUnit.SECONDS)) {
     *     try {
     *         // exclusive operation
     *     } finally {
     *         lock.unlock();
     *     }
     * }
     * </pre>
     *
     * @param lockRepository Repository for lock persistence
     * @return JdbcLockRegistry for obtaining locks
     */
    @Bean
    public JdbcLockRegistry lockRegistry(LockRepository lockRepository) {
        return new JdbcLockRegistry(lockRepository);
    }
}
