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
 */
@Service
@Transactional(readOnly = true)
public class PurchaseOrderQueryService {

    private final PurchaseOrderMapper purchaseOrderMapper;

    public PurchaseOrderQueryService(PurchaseOrderMapper purchaseOrderMapper) {
        this.purchaseOrderMapper = purchaseOrderMapper;
    }

    /**
     * Get all purchase orders with pagination.
     */
    public Page<PurchaseOrderSummaryView> listPurchaseOrders(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int size = pageable.getPageSize();

        List<PurchaseOrderSummaryView> content = purchaseOrderMapper.findAll(size, offset);
        long total = purchaseOrderMapper.countAll();

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get purchase orders by vendor ID with pagination.
     */
    public Page<PurchaseOrderSummaryView> listByVendorId(Long vendorId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int size = pageable.getPageSize();

        List<PurchaseOrderSummaryView> content = purchaseOrderMapper.findByVendorId(vendorId, size, offset);
        long total = purchaseOrderMapper.countByVendorId(vendorId);

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get purchase orders by status with pagination.
     */
    public Page<PurchaseOrderSummaryView> listByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int size = pageable.getPageSize();

        List<PurchaseOrderSummaryView> content = purchaseOrderMapper.findByStatus(status, size, offset);
        long total = purchaseOrderMapper.countByStatus(status);

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get purchase order details by ID.
     */
    public PurchaseOrderDetailView getPurchaseOrderDetail(Long id) {
        return purchaseOrderMapper.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with ID: " + id));
    }
}
