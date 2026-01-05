package com.wellkorea.backend.production.api.dto.command;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for creating a work progress sheet.
 */
public record CreateWorkProgressSheetRequest(
        @NotNull(message = "Project ID is required")
        Long projectId,

        @NotNull(message = "Product ID is required")
        Long productId,

        @Min(value = 1, message = "Quantity must be at least 1")
        Integer quantity,

        Integer sequence,

        String notes
) {
    public CreateWorkProgressSheetRequest {
        if (quantity == null) {
            quantity = 1;
        }
    }
}
