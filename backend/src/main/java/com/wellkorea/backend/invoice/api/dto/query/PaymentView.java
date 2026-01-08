package com.wellkorea.backend.invoice.api.dto.query;

import com.wellkorea.backend.invoice.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * View DTO for payment.
 */
public record PaymentView(
        Long id,
        Long invoiceId,
        LocalDate paymentDate,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        String paymentMethodLabelKo,
        String referenceNumber,
        String notes,
        Long recordedById,
        String recordedByName,
        Instant createdAt
) {
}
