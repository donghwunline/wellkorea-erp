package com.wellkorea.backend.purchasing.infrastructure.mapper;

import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestSummaryView;
import com.wellkorea.backend.purchasing.api.dto.query.RfqItemView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for purchase request queries.
 * Uses XML mapping for dynamic filters with optional status/projectId/dtype.
 */
@Mapper
public interface PurchaseRequestMapper {

    /**
     * Find purchase requests with optional filters.
     *
     * @param status    Optional status filter (null for all)
     * @param projectId Optional project filter (null for all)
     * @param dtype     Optional dtype filter: 'SERVICE' or 'MATERIAL' (null for all)
     * @param limit     Page size
     * @param offset    Starting offset
     * @return List of purchase request summaries
     */
    List<PurchaseRequestSummaryView> findWithFilters(@Param("status") String status,
                                                     @Param("projectId") Long projectId,
                                                     @Param("dtype") String dtype,
                                                     @Param("limit") int limit,
                                                     @Param("offset") long offset);

    /**
     * Count purchase requests with optional filters.
     *
     * @param status    Optional status filter (null for all)
     * @param projectId Optional project filter (null for all)
     * @param dtype     Optional dtype filter: 'SERVICE' or 'MATERIAL' (null for all)
     * @return Total count matching filters
     */
    long countWithFilters(@Param("status") String status,
                          @Param("projectId") Long projectId,
                          @Param("dtype") String dtype);

    /**
     * Find purchase request detail by ID with RFQ items.
     *
     * @param id Purchase request ID
     * @return Purchase request detail with nested RFQ items
     */
    Optional<PurchaseRequestDetailView> findDetailById(@Param("id") Long id);

    /**
     * Find RFQ items for a purchase request.
     * Used as nested select for detail view.
     *
     * @param purchaseRequestId Purchase request ID
     * @return List of RFQ items
     */
    List<RfqItemView> findRfqItemsByPurchaseRequestId(@Param("purchaseRequestId") Long purchaseRequestId);
}
