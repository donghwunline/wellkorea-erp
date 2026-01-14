package com.wellkorea.backend.report.api.dto;

import com.wellkorea.backend.invoice.domain.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * View DTO for individual invoice in AR report.
 */
public record ARInvoiceView(
        Long id,
        String invoiceNumber,
        Long projectId,
        String jobCode,
        Long customerId,
        String customerName,
        LocalDate issueDate,
        LocalDate dueDate,
        InvoiceStatus status,
        BigDecimal totalAmount,
        BigDecimal totalPaid,
        BigDecimal remainingBalance,
        long daysOverdue,
        String agingBucket
) {
}
