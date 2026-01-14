package com.wellkorea.backend.invoice.application;

import com.wellkorea.backend.invoice.api.dto.query.InvoiceDetailView;
import com.wellkorea.backend.invoice.api.dto.query.InvoiceSummaryView;
import com.wellkorea.backend.invoice.domain.InvoiceStatus;
import com.wellkorea.backend.invoice.infrastructure.mapper.InvoiceMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for invoice read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 *
 * <p>Uses MyBatis for all queries to avoid N+1 issues and optimize read performance.
 */
@Service
@Transactional(readOnly = true)
public class InvoiceQueryService {

    private final InvoiceMapper invoiceMapper;

    public InvoiceQueryService(InvoiceMapper invoiceMapper) {
        this.invoiceMapper = invoiceMapper;
    }

    /**
     * Get invoice detail by ID.
     * Returns full detail view including line items and payments.
     *
     * @param id Invoice ID
     * @return InvoiceDetailView with all nested data
     */
    public InvoiceDetailView getInvoiceDetail(Long id) {
        return invoiceMapper.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
    }

    /**
     * List invoices with optional project and status filters.
     * Returns summary views for display.
     * <p>
     * Returns empty list if project doesn't exist (no validation for simplicity).
     *
     * @param projectId Optional project ID filter
     * @param status    Optional filter by invoice status
     * @param pageable  Pagination parameters
     * @return Page of InvoiceSummaryView
     */
    public Page<InvoiceSummaryView> listInvoices(Long projectId, InvoiceStatus status, Pageable pageable) {
        List<InvoiceSummaryView> content = invoiceMapper.findWithFilters(
                projectId, status, pageable.getPageSize(), pageable.getOffset());
        long total = invoiceMapper.countWithFilters(projectId, status);
        return new PageImpl<>(content, pageable, total);
    }
}
