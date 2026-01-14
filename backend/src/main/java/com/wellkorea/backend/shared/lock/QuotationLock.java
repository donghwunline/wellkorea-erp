package com.wellkorea.backend.shared.lock;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation for methods that require a distributed quotation-level lock.
 * <p>
 * When a method is annotated with {@code @QuotationLock}, the {@link QuotationLockAspect}
 * automatically acquires a distributed lock before method execution and releases it
 * after completion (success or failure).
 * <p>
 * This is the preferred locking strategy for delivery and invoice operations because:
 * <ul>
 *   <li>Validation queries are quotation-scoped (quotation line items, delivered/invoiced quantities)</li>
 *   <li>More granular than project-level locking - different quotations can be processed concurrently</li>
 *   <li>Aligns with the domain model where deliveries and invoices are created against specific quotations</li>
 * </ul>
 *
 * <h2>Usage</h2>
 * <pre>{@code
 * @QuotationLock
 * public Long createDelivery(Long quotationId, CreateDeliveryRequest request, Long userId) {
 *     // Method has exclusive access to operations on this quotation
 * }
 *
 * // With custom parameter name
 * @QuotationLock(quotationIdParam = "targetQuotationId")
 * public Long reassignDelivery(Long deliveryId, Long targetQuotationId) {
 *     // Uses targetQuotationId for lock acquisition
 * }
 * }</pre>
 *
 * <h2>Execution Order</h2>
 * This annotation works with {@link QuotationLockAspect} which runs at {@code @Order(0)},
 * ensuring the lock is acquired BEFORE the transaction starts.
 *
 * @see QuotationLockAspect
 * @see QuotationLockService
 * @see ProjectLock
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface QuotationLock {

    /**
     * The name of the method parameter containing the quotation ID.
     * Defaults to "quotationId".
     *
     * @return the parameter name to extract the quotation ID from
     */
    String quotationIdParam() default "quotationId";
}
