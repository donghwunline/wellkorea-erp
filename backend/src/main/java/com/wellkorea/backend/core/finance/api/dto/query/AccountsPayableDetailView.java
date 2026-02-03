package com.wellkorea.backend.core.finance.api.dto.query;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Detail view for AccountsPayable with payment history.
 * Extends summary fields with List of VendorPaymentView.
 */
public record AccountsPayableDetailView(
        Long id,
        // Disbursement cause fields (abstracts the source of payment obligation)
        String causeType,
        Long causeId,
        String causeReferenceNumber,
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
        String calculatedStatus,
        // Payment history
        List<VendorPaymentView> payments
) {
}
