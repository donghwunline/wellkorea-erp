package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderSummaryView;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseOrderMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for purchase order read operations.
 * Uses MyBatis mapper with dynamic filters for flexible querying.
 */
@Service
@Transactional(readOnly = true)
public class PurchaseOrderQueryService {

    private final PurchaseOrderMapper purchaseOrderMapper;

    public PurchaseOrderQueryService(PurchaseOrderMapper purchaseOrderMapper) {
        this.purchaseOrderMapper = purchaseOrderMapper;
    }

    /**
     * List purchase orders with optional filters.
     * Consolidates multiple query methods into one with dynamic filtering.
     *
     * @param status   Optional status filter (null for all statuses)
     * @param vendorId Optional vendor filter (null for all vendors)
     * @param pageable Pagination parameters
     * @return Page of purchase order summaries
     */
    public Page<PurchaseOrderSummaryView> listPurchaseOrders(String status,
                                                              Long vendorId,
                                                              Pageable pageable) {
        List<PurchaseOrderSummaryView> content = purchaseOrderMapper.findWithFilters(
                status,
                vendorId,
                pageable.getPageSize(),
                pageable.getOffset()
        );
        long total = purchaseOrderMapper.countWithFilters(status, vendorId);

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get purchase order details by ID.
     *
     * @param id Purchase order ID
     * @return Purchase order detail
     * @throws ResourceNotFoundException if not found
     */
    public PurchaseOrderDetailView getPurchaseOrderDetail(Long id) {
        return purchaseOrderMapper.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with ID: " + id));
    }
}
