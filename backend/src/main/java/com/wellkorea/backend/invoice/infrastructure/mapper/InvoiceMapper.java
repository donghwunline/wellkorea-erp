package com.wellkorea.backend.invoice.infrastructure.mapper;

import com.wellkorea.backend.invoice.api.dto.query.InvoiceDetailView;
import com.wellkorea.backend.invoice.api.dto.query.InvoiceSummaryView;
import com.wellkorea.backend.invoice.domain.InvoiceStatus;
import com.wellkorea.backend.shared.dto.ProductQuantitySum;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for invoice queries.
 * Provides optimized read operations separate from JPA repository.
 * Eliminates N+1 queries by using explicit JOINs for related entities.
 */
@Mapper
public interface InvoiceMapper {

    /**
     * Find invoice detail by ID with all related data.
     */
    Optional<InvoiceDetailView> findDetailById(@Param("id") Long id);

    /**
     * Find invoices with optional project and status filters.
     */
    List<InvoiceSummaryView> findWithFilters(@Param("projectId") Long projectId,
                                             @Param("status") InvoiceStatus status,
                                             @Param("limit") int limit,
                                             @Param("offset") long offset);

    /**
     * Count invoices with optional project and status filters.
     */
    long countWithFilters(@Param("projectId") Long projectId,
                          @Param("status") InvoiceStatus status);

    /**
     * Get invoiced quantities for all products linked to a specific quotation.
     * Excludes CANCELLED invoices.
     * <p>
     * Used for validating new invoices against quotation/delivery limits.
     * Each quotation tracks its own invoice progress independently.
     *
     * @param quotationId Quotation ID to query invoices for
     * @return List of product quantity summaries
     */
    List<ProductQuantitySum> getInvoicedQuantitiesByQuotation(@Param("quotationId") Long quotationId);

    /**
     * Check if an invoice exists by ID.
     *
     * @param id Invoice ID
     * @return true if exists
     */
    boolean existsById(@Param("id") Long id);
}
