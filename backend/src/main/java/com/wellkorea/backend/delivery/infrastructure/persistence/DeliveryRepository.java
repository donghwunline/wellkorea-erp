package com.wellkorea.backend.delivery.infrastructure.persistence;

import com.wellkorea.backend.delivery.domain.Delivery;
import com.wellkorea.backend.delivery.domain.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Delivery entities.
 * Provides queries for delivery tracking and over-delivery prevention.
 */
@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    /**
     * Find all deliveries for a project.
     * Ordered by delivery date descending (most recent first).
     *
     * @param projectId Project ID
     * @return List of deliveries
     */
    List<Delivery> findByProjectIdOrderByDeliveryDateDesc(Long projectId);

    /**
     * Find all deliveries for a project with a specific status.
     *
     * @param projectId Project ID
     * @param status    Delivery status
     * @return List of deliveries
     */
    List<Delivery> findByProjectIdAndStatus(Long projectId, DeliveryStatus status);

    /**
     * Check if a project has any deliveries.
     *
     * @param projectId Project ID
     * @return true if project has deliveries
     */
    boolean existsByProjectId(Long projectId);

    /**
     * Get total delivered quantity for a specific product in a project.
     * Excludes RETURNED deliveries.
     *
     * @param projectId Project ID
     * @param productId Product ID
     * @return Total delivered quantity (null if no deliveries)
     */
    @Query("""
            SELECT SUM(dli.quantityDelivered)
            FROM DeliveryLineItem dli
            JOIN dli.delivery d
            WHERE d.projectId = :projectId
            AND dli.productId = :productId
            AND d.status != 'RETURNED'
            """)
    Double getTotalDeliveredQuantity(@Param("projectId") Long projectId,
                                     @Param("productId") Long productId);

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
