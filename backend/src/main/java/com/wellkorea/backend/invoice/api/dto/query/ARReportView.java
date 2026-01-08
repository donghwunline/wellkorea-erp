package com.wellkorea.backend.invoice.api.dto.query;

import java.math.BigDecimal;
import java.util.List;

/**
 * View DTO for Accounts Receivable (AR) aging report.
 */
public record ARReportView(
        // Summary totals
        BigDecimal totalOutstanding,
        BigDecimal currentAmount,     // Not yet due
        BigDecimal days30Amount,       // 1-30 days overdue
        BigDecimal days60Amount,       // 31-60 days overdue
        BigDecimal days90PlusAmount,   // 90+ days overdue

        // Counts
        int totalInvoices,
        int currentCount,
        int days30Count,
        int days60Count,
        int days90PlusCount,

        // Detailed breakdown by customer
        List<CustomerARView> byCustomer,

        // Individual invoice details
        List<ARInvoiceView> invoices
) {
}
