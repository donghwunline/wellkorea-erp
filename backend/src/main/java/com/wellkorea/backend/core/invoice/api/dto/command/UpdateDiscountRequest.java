package com.wellkorea.backend.core.invoice.api.dto.command;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/**
 * Request DTO for updating an invoice's discount amount.
 * <p>
 * The quotationId is required for distributed locking via {@link com.wellkorea.backend.shared.lock.QuotationLock}.
 */
public record UpdateDiscountRequest(
        @NotNull(message = "Quotation ID is required")
        Long quotationId,

        @NotNull(message = "Discount amount is required")
        @PositiveOrZero(message = "Discount amount must be non-negative")
        BigDecimal discountAmount
) {
}
