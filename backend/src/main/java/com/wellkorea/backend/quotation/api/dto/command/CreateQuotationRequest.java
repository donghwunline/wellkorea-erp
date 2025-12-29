package com.wellkorea.backend.quotation.api.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request DTO for creating a quotation.
 */
public record CreateQuotationRequest(
        @NotNull(message = "Project ID is required")
        Long projectId,

        @Positive(message = "Validity days must be positive")
        Integer validityDays,

        @Size(max = 2000, message = "Notes must be at most 2000 characters")
        String notes,

        @NotEmpty(message = "At least one line item is required")
        @Valid
        List<LineItemRequest> lineItems
) {
}
