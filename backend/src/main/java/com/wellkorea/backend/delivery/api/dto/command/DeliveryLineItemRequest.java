package com.wellkorea.backend.delivery.api.dto.command;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/**
 * Request DTO for a delivery line item.
 * Each line item specifies a product and quantity being delivered.
 */
public record DeliveryLineItemRequest(
        @NotNull(message = "Product ID is required")
        Long productId,

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be greater than 0")
        BigDecimal quantityDelivered
) {
}
