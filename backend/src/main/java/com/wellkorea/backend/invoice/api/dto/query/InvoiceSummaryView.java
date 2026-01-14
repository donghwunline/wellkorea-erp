package com.wellkorea.backend.invoice.api.dto.query;

import com.wellkorea.backend.invoice.domain.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Summary view DTO for invoice listings.
 */
public record InvoiceSummaryView(
        Long id,
        Long projectId,
        Long quotationId,
        String jobCode,
        String invoiceNumber,
        LocalDate issueDate,
        InvoiceStatus status,
        String statusLabelKo,
        BigDecimal totalAmount,
        BigDecimal totalPaid,
        BigDecimal remainingBalance,
        LocalDate dueDate,
        boolean isOverdue,
        String agingBucket,
        int lineItemCount,
        int paymentCount
) {
}
