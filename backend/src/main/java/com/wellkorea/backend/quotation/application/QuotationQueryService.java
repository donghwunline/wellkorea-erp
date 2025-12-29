package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.quotation.api.dto.query.QuotationDetailView;
import com.wellkorea.backend.quotation.api.dto.query.QuotationSummaryView;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.quotation.infrastructure.mapper.QuotationMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for quotation read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 *
 * <p>Uses MyBatis for all queries to avoid N+1 issues and optimize read performance.
 */
@Service
@Transactional(readOnly = true)
public class QuotationQueryService {

    private final QuotationMapper quotationMapper;

    public QuotationQueryService(QuotationMapper quotationMapper) {
        this.quotationMapper = quotationMapper;
    }

    /**
     * Get quotation detail by ID.
     * Returns full detail view including line items.
     *
     * <p>Uses MyBatis mapper to avoid N+1 queries on Product entity.
     */
    public QuotationDetailView getQuotationDetail(Long quotationId) {
        return quotationMapper.findDetailById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));
    }

    /**
     * List quotations with filters.
     * Returns summary views optimized for list display (no line items).
     *
     * <p>Uses MyBatis mapper to avoid N+1 queries on Project and User entities.
     */
    public Page<QuotationSummaryView> listQuotations(QuotationStatus status, Long projectId, Pageable pageable) {
        List<QuotationSummaryView> content = quotationMapper.findWithFilters(status, projectId, pageable.getPageSize(), pageable.getOffset());
        long total = quotationMapper.countWithFilters(status, projectId);
        return new PageImpl<>(content, pageable, total);
    }
}
