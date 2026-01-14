package com.wellkorea.backend.report.api.dto;

import java.math.BigDecimal;

/**
 * View DTO for customer-level AR summary.
 */
public record CustomerARView(
        Long customerId,
        String customerName,
        BigDecimal totalOutstanding,
        BigDecimal currentAmount,
        BigDecimal days30Amount,
        BigDecimal days60Amount,
        BigDecimal days90PlusAmount,
        int invoiceCount
) {
}
