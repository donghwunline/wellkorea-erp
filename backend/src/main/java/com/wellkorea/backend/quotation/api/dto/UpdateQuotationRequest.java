package com.wellkorea.backend.quotation.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import java.util.List;

/**
 * Request DTO for updating a quotation.
 */
public record UpdateQuotationRequest(
        @Positive(message = "Validity days must be positive")
        Integer validityDays,

        String notes,

        @NotEmpty(message = "At least one line item is required")
        @Valid
        List<LineItemRequest> lineItems
) {}
