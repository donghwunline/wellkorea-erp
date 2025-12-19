package com.wellkorea.backend.quotation.api.dto;

import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a quotation.
 */
public record QuotationResponse(
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
        List<LineItemResponse> lineItems
) {
    public static QuotationResponse from(Quotation quotation) {
        return new QuotationResponse(
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
                        .map(LineItemResponse::from)
                        .toList()
        );
    }

    public static QuotationResponse fromSummary(Quotation quotation) {
        return new QuotationResponse(
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
                null // No line items in summary
        );
    }
}
