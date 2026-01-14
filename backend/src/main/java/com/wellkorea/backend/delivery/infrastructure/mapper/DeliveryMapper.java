package com.wellkorea.backend.delivery.infrastructure.mapper;

import com.wellkorea.backend.delivery.api.dto.query.DeliveryDetailView;
import com.wellkorea.backend.delivery.api.dto.query.DeliverySummaryView;
import com.wellkorea.backend.delivery.domain.DeliveryStatus;
import com.wellkorea.backend.shared.dto.ProductQuantitySum;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for delivery queries.
 * Eliminates N+1 queries by using explicit JOINs for related entities.
 */
@Mapper
public interface DeliveryMapper {

    /**
     * Find delivery detail by ID with all related data.
     */
    Optional<DeliveryDetailView> findDetailById(@Param("id") Long id);

    /**
     * Find deliveries with optional project and status filters.
     */
    List<DeliverySummaryView> findWithFilters(
            @Param("projectId") Long projectId,
            @Param("status") DeliveryStatus status,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count deliveries with optional project and status filters.
     */
    long countWithFilters(
            @Param("projectId") Long projectId,
            @Param("status") DeliveryStatus status);

    /**
     * Get delivered quantities for all products in a project.
     * Excludes RETURNED deliveries.
     * <p>
     * Returns typed results via MyBatis mapping, eliminating need for
     * manual Object[] conversion that was required with JPA.
     *
     * @param projectId Project ID
     * @return List of product quantity summaries
     * @deprecated Use {@link #getDeliveredQuantitiesByQuotation(Long, Long)} instead.
     *             Deliveries are linked to specific quotations, not project-wide.
     */
    @Deprecated
    List<ProductQuantitySum> getDeliveredQuantitiesByProject(@Param("projectId") Long projectId);

    /**
     * Get delivered quantities for all products linked to a specific quotation.
     * Excludes RETURNED deliveries.
     * <p>
     * Used for validating new deliveries against quotation limits.
     * Each quotation tracks its own delivery progress independently.
     *
     * @param quotationId     Quotation ID to query deliveries for
     * @param excludeDeliveryId Optional delivery ID to exclude (for reassignment validation)
     * @return List of product quantity summaries
     */
    List<ProductQuantitySum> getDeliveredQuantitiesByQuotation(
            @Param("quotationId") Long quotationId,
            @Param("excludeDeliveryId") Long excludeDeliveryId);
}
