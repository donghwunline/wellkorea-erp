package com.wellkorea.backend.finance.api.dto.query;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Summary view for AccountsPayable with calculated status from payments.
 * Status is computed from vendor_payments table, not stored in AP.
 */
public record AccountsPayableSummaryView(
        Long id,
        // Disbursement cause fields (new - abstracts the source of payment obligation)
        String causeType,
        Long causeId,
        String causeReferenceNumber,
        // Legacy PO fields (deprecated but retained for backward compatibility)
        Long purchaseOrderId,
        String poNumber,
        // Vendor info
        Long vendorId,
        String vendorName,
        // Amount info
        BigDecimal totalAmount,
        String currency,
        // Dates
        LocalDate dueDate,
        Instant createdAt,
        // Notes
        String notes,
        // CALCULATED fields from vendor_payments
        BigDecimal totalPaid,
        BigDecimal remainingBalance,
        Boolean isOverdue,
        Integer daysOverdue,
        String agingBucket,
        String calculatedStatus    // PENDING | PARTIALLY_PAID | PAID
) {
}
