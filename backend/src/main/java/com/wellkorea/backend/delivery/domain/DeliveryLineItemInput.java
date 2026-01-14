package com.wellkorea.backend.delivery.domain;

import java.math.BigDecimal;

/**
 * Domain input for creating a delivery line item.
 * This is a simple value object used by the Quotation factory method.
 * <p>
 * Unlike API DTOs, this record has no Jakarta validation annotations -
 * validation is handled by {@link QuotationDeliveryGuard}.
 *
 * @param productId         Product ID to deliver
 * @param quantityDelivered Quantity to deliver
 */
public record DeliveryLineItemInput(
        Long productId,
        BigDecimal quantityDelivered
) {
    /**
     * Compact constructor for null checks.
     */
    public DeliveryLineItemInput {
        if (productId == null) {
            throw new IllegalArgumentException("productId must not be null");
        }
        if (quantityDelivered == null) {
            throw new IllegalArgumentException("quantityDelivered must not be null");
        }
    }
}
