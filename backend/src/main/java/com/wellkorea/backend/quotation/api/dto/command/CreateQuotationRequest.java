package com.wellkorea.backend.quotation.api.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

/**
 * Request DTO for creating a quotation.
 */
public record CreateQuotationRequest(
        @NotNull(message = "Project ID is required")
        Long projectId,

        @Positive(message = "Validity days must be positive")
        Integer validityDays,

        String notes,

        @NotEmpty(message = "At least one line item is required")
        @Valid
        List<LineItemRequest> lineItems
) {
}
