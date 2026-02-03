package com.wellkorea.backend.core.finance.api.dto.query;

import com.wellkorea.backend.core.finance.domain.vo.VendorPaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * View DTO for vendor payment history.
 * Used in AccountsPayableDetailView to show payment records.
 */
public record VendorPaymentView(
        Long id,
        Long accountsPayableId,
        LocalDate paymentDate,
        BigDecimal amount,
        VendorPaymentMethod paymentMethod,
        String referenceNumber,
        String notes,
        Long recordedById,
        String recordedByName,
        Instant createdAt
) {
}
