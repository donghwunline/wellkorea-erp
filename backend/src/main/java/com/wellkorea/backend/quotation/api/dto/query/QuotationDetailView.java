package com.wellkorea.backend.quotation.api.dto.query;

import com.wellkorea.backend.quotation.domain.Quotation;
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
    public static QuotationDetailView from(Quotation quotation) {
        return new QuotationDetailView(
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
                quotation.getUpdatedAt(),
                quotation.getLineItems().stream()
                        .map(LineItemView::from)
                        .toList()
        );
    }
}
