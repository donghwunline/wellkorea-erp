package com.wellkorea.backend.shared.lock;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation for methods that require a distributed project-level lock.
 * <p>
 * When a method is annotated with {@code @ProjectLock}, the {@link ProjectLockAspect}
 * automatically acquires a distributed lock before method execution and releases it
 * after completion (success or failure).
 * <p>
 * This separates the locking cross-cutting concern from business logic, allowing
 * service methods to remain focused on their core responsibilities.
 *
 * <h2>Usage Example</h2>
 * <pre>
 * &#64;ProjectLock(projectIdParam = "projectId")
 * public Long createDelivery(Long projectId, CreateDeliveryRequest request, Long userId) {
 *     // Pure business logic - no locking awareness needed
 *     Quotation quotation = findApprovedQuotation(projectId);
 *     return saveDelivery(quotation, request, userId);
 * }
 * </pre>
 *
 * <h2>Lock Behavior</h2>
 * <ul>
 *   <li>Locks are per-project with key format: {@code project:{projectId}}</li>
 *   <li>Lock acquisition timeout: 5 seconds (default)</li>
 *   <li>Lock TTL: 30 seconds (prevents deadlocks if process crashes)</li>
 *   <li>Backend: PostgreSQL via Spring Integration JdbcLockRegistry</li>
 * </ul>
 *
 * @see ProjectLockAspect
 * @see ProjectLockService
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ProjectLock {

    /**
     * The name of the method parameter containing the project ID.
     * <p>
     * The aspect will extract the project ID from this parameter to construct
     * the lock key.
     *
     * @return parameter name containing the project ID
     */
    String projectIdParam() default "projectId";
}
