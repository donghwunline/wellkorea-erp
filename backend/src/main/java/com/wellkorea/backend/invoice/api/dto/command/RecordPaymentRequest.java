package com.wellkorea.backend.invoice.api.dto.command;

import com.wellkorea.backend.invoice.domain.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for recording a payment against an invoice.
 */
public record RecordPaymentRequest(
        @NotNull(message = "Payment date is required")
        LocalDate paymentDate,

        @NotNull(message = "Payment amount is required")
        @DecimalMin(value = "0.01", message = "Payment amount must be positive")
        BigDecimal amount,

        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod,

        @Size(max = 100, message = "Reference number cannot exceed 100 characters")
        String referenceNumber,

        String notes
) {
}
