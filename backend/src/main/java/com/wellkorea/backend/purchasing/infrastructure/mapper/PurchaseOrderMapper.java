package com.wellkorea.backend.purchasing.infrastructure.mapper;

import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderSummaryView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for purchase order queries.
 * Uses XML mapping for dynamic filters with optional status/vendorId.
 */
@Mapper
public interface PurchaseOrderMapper {

    /**
     * Find purchase orders with optional filters.
     *
     * @param status   Optional status filter (null for all)
     * @param vendorId Optional vendor filter (null for all)
     * @param limit    Page size
     * @param offset   Starting offset
     * @return List of purchase order summaries
     */
    List<PurchaseOrderSummaryView> findWithFilters(@Param("status") String status,
                                                   @Param("vendorId") Long vendorId,
                                                   @Param("limit") int limit,
                                                   @Param("offset") long offset);

    /**
     * Count purchase orders with optional filters.
     *
     * @param status   Optional status filter (null for all)
     * @param vendorId Optional vendor filter (null for all)
     * @return Total count matching filters
     */
    long countWithFilters(@Param("status") String status,
                          @Param("vendorId") Long vendorId);

    /**
     * Find purchase order detail by ID.
     *
     * @param id Purchase order ID
     * @return Purchase order detail
     */
    Optional<PurchaseOrderDetailView> findDetailById(@Param("id") Long id);
}
