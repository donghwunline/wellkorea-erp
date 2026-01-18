package com.wellkorea.backend.purchasing.api.dto.command;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for RFQ item actions that only require the item ID
 * (mark-no-response, select-vendor, reject).
 */
public record RfqItemActionRequest(
        @NotBlank(message = "Item ID is required")
        String itemId
) {
}
