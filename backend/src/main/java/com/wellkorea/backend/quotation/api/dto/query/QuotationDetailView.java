package com.wellkorea.backend.quotation.api.dto.query;

import com.wellkorea.backend.quotation.domain.QuotationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Read model for quotation detail views.
 * Includes line items for full detail display.
 */
public record QuotationDetailView(
        Long id,
        Long projectId,
        Long customerId,
        String projectName,
        String jobCode,
        Integer version,
        QuotationStatus status,
        LocalDate quotationDate,
        Integer validityDays,
        LocalDate expiryDate,
        BigDecimal totalAmount,
        String notes,
        Long createdById,
        String createdByName,
        LocalDateTime submittedAt,
        LocalDateTime approvedAt,
        Long approvedById,
        String approvedByName,
        String rejectionReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<LineItemView> lineItems
) {
}
