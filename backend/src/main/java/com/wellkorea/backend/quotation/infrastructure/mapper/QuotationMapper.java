package com.wellkorea.backend.quotation.infrastructure.mapper;

import com.wellkorea.backend.quotation.api.dto.query.QuotationDetailView;
import com.wellkorea.backend.quotation.api.dto.query.QuotationSummaryView;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for quotation queries.
 * Handles all read operations for quotations with optimized JOINs.
 *
 * <p>This mapper eliminates N+1 queries by using explicit JOINs and nested result mapping.
 */
@Mapper
public interface QuotationMapper {

    /**
     * Find quotation detail by ID with all related data in a single query.
     * Replaces JPA findByIdWithLineItems() which had N+1 issue on Product entity.
     *
     * @param id The quotation ID
     * @return QuotationDetailView with all nested data (project, createdBy, lineItems with products)
     */
    Optional<QuotationDetailView> findDetailById(@Param("id") Long id);

    /**
     * Find quotations with filters.
     * Returns summary views optimized for list display.
     *
     * @param status    Optional filter by quotation status
     * @param projectId Optional filter by project ID
     * @param limit     Page size
     * @param offset    Page offset
     * @return List of QuotationSummaryView with project and user data
     */
    List<QuotationSummaryView> findWithFilters(
            @Param("status") QuotationStatus status,
            @Param("projectId") Long projectId,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count quotations with filters (for pagination).
     */
    long countWithFilters(
            @Param("status") QuotationStatus status,
            @Param("projectId") Long projectId);
}
