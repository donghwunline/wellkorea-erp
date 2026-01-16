package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestSummaryView;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseRequestMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for purchase request read operations.
 * Uses MyBatis mapper with dynamic filters for flexible querying.
 * Supports both SERVICE (outsourcing) and MATERIAL (physical items) types.
 */
@Service
@Transactional(readOnly = true)
public class PurchaseRequestQueryService {

    private final PurchaseRequestMapper purchaseRequestMapper;

    public PurchaseRequestQueryService(PurchaseRequestMapper purchaseRequestMapper) {
        this.purchaseRequestMapper = purchaseRequestMapper;
    }

    /**
     * List purchase requests with optional filters.
     * Consolidates multiple query methods into one with dynamic filtering.
     *
     * @param status    Optional status filter (null for all statuses)
     * @param projectId Optional project filter (null for all projects)
     * @param dtype     Optional dtype filter: 'SERVICE' or 'MATERIAL' (null for all types)
     * @param pageable  Pagination parameters
     * @return Page of purchase request summaries
     */
    public Page<PurchaseRequestSummaryView> listPurchaseRequests(String status,
                                                                  Long projectId,
                                                                  String dtype,
                                                                  Pageable pageable) {
        List<PurchaseRequestSummaryView> content = purchaseRequestMapper.findWithFilters(
                status,
                projectId,
                dtype,
                pageable.getPageSize(),
                pageable.getOffset()
        );
        long total = purchaseRequestMapper.countWithFilters(status, projectId, dtype);

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * List service purchase requests (outsourcing).
     *
     * @param status    Optional status filter
     * @param projectId Optional project filter
     * @param pageable  Pagination parameters
     * @return Page of service purchase request summaries
     */
    public Page<PurchaseRequestSummaryView> listServicePurchaseRequests(String status,
                                                                         Long projectId,
                                                                         Pageable pageable) {
        return listPurchaseRequests(status, projectId, "SERVICE", pageable);
    }

    /**
     * List material purchase requests (physical items).
     *
     * @param status    Optional status filter
     * @param projectId Optional project filter
     * @param pageable  Pagination parameters
     * @return Page of material purchase request summaries
     */
    public Page<PurchaseRequestSummaryView> listMaterialPurchaseRequests(String status,
                                                                          Long projectId,
                                                                          Pageable pageable) {
        return listPurchaseRequests(status, projectId, "MATERIAL", pageable);
    }

    /**
     * Get purchase request details by ID.
     *
     * @param id Purchase request ID
     * @return Purchase request detail with RFQ items
     * @throws ResourceNotFoundException if not found
     */
    public PurchaseRequestDetailView getPurchaseRequestDetail(Long id) {
        return purchaseRequestMapper.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + id));
    }
}
