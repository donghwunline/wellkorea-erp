package com.wellkorea.backend.delivery.infrastructure.persistence;

import com.wellkorea.backend.delivery.domain.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Delivery entities.
 * Provides queries for delivery tracking and over-delivery prevention.
 * <p>
 * Concurrency control is handled by {@link com.wellkorea.backend.shared.lock.ProjectLockService}
 * at the service layer, not at the repository level.
 */
@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    /**
     * Get delivered quantities for all products in a project.
     * Returns a list of [productId, totalDelivered] arrays.
     * Excludes RETURNED deliveries.
     *
     * @param projectId Project ID
     * @return List of product delivery summaries
     */
    @Query("""
            SELECT dli.productId, SUM(dli.quantityDelivered)
            FROM DeliveryLineItem dli
            JOIN dli.delivery d
            WHERE d.projectId = :projectId
            AND d.status != 'RETURNED'
            GROUP BY dli.productId
            """)
    List<Object[]> getDeliveredQuantitiesByProject(@Param("projectId") Long projectId);
}
