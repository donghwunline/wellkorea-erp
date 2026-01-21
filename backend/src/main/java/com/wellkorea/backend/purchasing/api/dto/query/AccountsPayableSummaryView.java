package com.wellkorea.backend.purchasing.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

/**
 * Summary view for AccountsPayable with calculated status from payments.
 * Status is computed from company_payments table, not stored in AP.
 */
public record AccountsPayableSummaryView(
        Long id,
        Long purchaseOrderId,
        String poNumber,
        Long vendorId,
        String vendorName,
        BigDecimal totalAmount,
        String currency,
        LocalDate dueDate,
        String notes,
        Instant createdAt,
        // CALCULATED fields from company_payments
        BigDecimal totalPaid,
        BigDecimal remainingBalance,
        Boolean isOverdue,
        Integer daysOverdue,
        String agingBucket,
        String calculatedStatus    // PENDING | PARTIALLY_PAID | PAID
) {}
