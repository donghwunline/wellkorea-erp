package com.wellkorea.backend.delivery.api.dto.query;

import java.math.BigDecimal;

/**
 * View DTO for a delivery line item.
 * Includes resolved product information for display.
 */
public record DeliveryLineItemView(
        Long id,
        Long productId,
        String productName,
        String productSku,
        BigDecimal quantityDelivered
) {
}
