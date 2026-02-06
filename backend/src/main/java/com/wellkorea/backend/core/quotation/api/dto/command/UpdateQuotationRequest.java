package com.wellkorea.backend.core.quotation.api.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for updating a quotation.
 */
public record UpdateQuotationRequest(
        @Positive(message = "Validity days must be positive")
        Integer validityDays,

        @DecimalMin(value = "0.00", message = "Tax rate must be between 0 and 100")
        @DecimalMax(value = "100.00", message = "Tax rate must be between 0 and 100")
        @Digits(integer = 3, fraction = 2)
        BigDecimal taxRate,

        @DecimalMin(value = "0.00", message = "Discount amount cannot be negative")
        @Digits(integer = 13, fraction = 2)
        BigDecimal discountAmount,

        @Size(max = 2000, message = "Notes must be at most 2000 characters")
        String notes,

        @NotEmpty(message = "At least one line item is required")
        @Valid
        List<LineItemRequest> lineItems
) {
}
