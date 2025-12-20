package com.wellkorea.backend.quotation.api.dto.query;

import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Read model for quotation list views.
 * Optimized for summary display - excludes line items for performance.
 */
public record QuotationSummaryView(
        Long id,
        Long projectId,
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
        LocalDateTime updatedAt
) {
    public static QuotationSummaryView from(Quotation quotation) {
        return new QuotationSummaryView(
                quotation.getId(),
                quotation.getProject().getId(),
                quotation.getProject().getProjectName(),
                quotation.getProject().getJobCode(),
                quotation.getVersion(),
                quotation.getStatus(),
                quotation.getQuotationDate(),
                quotation.getValidityDays(),
                quotation.getExpiryDate(),
                quotation.getTotalAmount(),
                quotation.getNotes(),
                quotation.getCreatedBy().getId(),
                quotation.getCreatedBy().getFullName(),
                quotation.getSubmittedAt(),
                quotation.getApprovedAt(),
                quotation.getApprovedBy() != null ? quotation.getApprovedBy().getId() : null,
                quotation.getApprovedBy() != null ? quotation.getApprovedBy().getFullName() : null,
                quotation.getRejectionReason(),
                quotation.getCreatedAt(),
                quotation.getUpdatedAt()
        );
    }
}
