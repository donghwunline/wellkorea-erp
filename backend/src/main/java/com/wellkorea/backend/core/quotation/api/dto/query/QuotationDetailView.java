package com.wellkorea.backend.core.quotation.api.dto.query;

import com.wellkorea.backend.core.quotation.domain.QuotationStatus;
import com.wellkorea.backend.supporting.approval.domain.vo.ApprovalStateStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Read model for quotation detail views.
 * Includes line items for full detail display.
 * <p>
 * Amount calculation:
 * subtotal = sum(line_items.line_total)
 * taxAmount = subtotal × taxRate / 100
 * amountBeforeDiscount = subtotal + taxAmount
 * finalAmount = amountBeforeDiscount - discountAmount
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
        // Amount fields
        BigDecimal subtotal,              // Sum of line items (was totalAmount)
        BigDecimal taxRate,               // Tax rate percentage (0-100)
        BigDecimal taxAmount,             // Computed: subtotal × taxRate / 100
        BigDecimal amountBeforeDiscount,  // Computed: subtotal + taxAmount
        BigDecimal discountAmount,        // Fixed discount in KRW
        BigDecimal finalAmount,           // Computed: amountBeforeDiscount - discountAmount
        String notes,
        Long createdById,
        String createdByName,
        // Approval fields (from ApprovalState embedded columns)
        ApprovalStateStatus approvalStatus,
        Long submittedById,
        String submittedByName,
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
