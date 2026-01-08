package com.wellkorea.backend.invoice.api.dto.query;

import com.wellkorea.backend.invoice.domain.InvoiceStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Detailed view DTO for a tax invoice.
 * Includes all line items and payment history.
 */
public record InvoiceDetailView(
        Long id,
        Long projectId,
        String jobCode,
        Long deliveryId,
        String invoiceNumber,
        LocalDate issueDate,
        InvoiceStatus status,
        String statusLabelKo,
        BigDecimal totalBeforeTax,
        BigDecimal taxRate,
        BigDecimal totalTax,
        BigDecimal totalAmount,
        BigDecimal totalPaid,
        BigDecimal remainingBalance,
        LocalDate dueDate,
        String notes,
        Long createdById,
        String createdByName,
        Instant createdAt,
        Instant updatedAt,
        LocalDate issuedToCustomerDate,
        boolean isOverdue,
        long daysOverdue,
        String agingBucket,
        List<InvoiceLineItemView> lineItems,
        List<PaymentView> payments
) {
}
