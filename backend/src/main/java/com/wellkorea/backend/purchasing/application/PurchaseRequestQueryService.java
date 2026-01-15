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
     * @param pageable  Pagination parameters
     * @return Page of purchase request summaries
     */
    public Page<PurchaseRequestSummaryView> listPurchaseRequests(String status,
                                                                  Long projectId,
                                                                  Pageable pageable) {
        List<PurchaseRequestSummaryView> content = purchaseRequestMapper.findWithFilters(
                status,
                projectId,
                pageable.getPageSize(),
                pageable.getOffset()
        );
        long total = purchaseRequestMapper.countWithFilters(status, projectId);

        return new PageImpl<>(content, pageable, total);
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
