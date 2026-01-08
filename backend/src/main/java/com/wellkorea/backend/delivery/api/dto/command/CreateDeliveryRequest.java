package com.wellkorea.backend.delivery.api.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a new delivery.
 * Validates required fields before delivery creation.
 */
public record CreateDeliveryRequest(
        @NotNull(message = "Delivery date is required")
        @PastOrPresent(message = "Delivery date cannot be in the future")
        LocalDate deliveryDate,

        @NotEmpty(message = "At least one line item is required")
        @Valid
        List<DeliveryLineItemRequest> lineItems,

        String notes
) {
}
