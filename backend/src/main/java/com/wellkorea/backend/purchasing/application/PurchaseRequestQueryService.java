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
 */
@Service
@Transactional(readOnly = true)
public class PurchaseRequestQueryService {

    private final PurchaseRequestMapper purchaseRequestMapper;

    public PurchaseRequestQueryService(PurchaseRequestMapper purchaseRequestMapper) {
        this.purchaseRequestMapper = purchaseRequestMapper;
    }

    /**
     * Get all purchase requests with pagination.
     */
    public Page<PurchaseRequestSummaryView> listPurchaseRequests(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int size = pageable.getPageSize();

        List<PurchaseRequestSummaryView> content = purchaseRequestMapper.findAll(size, offset);
        long total = purchaseRequestMapper.countAll();

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get purchase requests by project ID with pagination.
     */
    public Page<PurchaseRequestSummaryView> listByProjectId(Long projectId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int size = pageable.getPageSize();

        List<PurchaseRequestSummaryView> content = purchaseRequestMapper.findByProjectId(projectId, size, offset);
        long total = purchaseRequestMapper.countByProjectId(projectId);

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get purchase requests by status with pagination.
     */
    public Page<PurchaseRequestSummaryView> listByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int size = pageable.getPageSize();

        List<PurchaseRequestSummaryView> content = purchaseRequestMapper.findByStatus(status, size, offset);
        long total = purchaseRequestMapper.countByStatus(status);

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get purchase request details by ID.
     */
    public PurchaseRequestDetailView getPurchaseRequestDetail(Long id) {
        return purchaseRequestMapper.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + id));
    }
}
