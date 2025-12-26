package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.quotation.api.dto.query.QuotationDetailView;
import com.wellkorea.backend.quotation.api.dto.query.QuotationSummaryView;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.quotation.infrastructure.mapper.QuotationMapper;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Query service for quotation read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 *
 * <p>Uses MyBatis for complex queries (detail with nested line items) to avoid N+1 issues.
 * Uses JPA repository for simple list queries.
 */
@Service
@Transactional(readOnly = true)
public class QuotationQueryService {

    private final QuotationRepository quotationRepository;
    private final QuotationMapper quotationMapper;

    public QuotationQueryService(QuotationRepository quotationRepository,
                                  QuotationMapper quotationMapper) {
        this.quotationRepository = quotationRepository;
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
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + quotationId));
    }

    /**
     * List quotations with filters.
     * Returns summary views optimized for list display (no line items).
     */
    public Page<QuotationSummaryView> listQuotations(QuotationStatus status, Long projectId, Pageable pageable) {
        Page<Quotation> quotations = quotationRepository.findAllWithFilters(status, projectId, pageable);
        return quotations.map(QuotationSummaryView::from);
    }
}
