package com.wellkorea.backend.invoice.domain;

import java.math.BigDecimal;

/**
 * Domain input for creating an invoice line item.
 * This is a simple value object used for validation and entity creation.
 * <p>
 * Unlike API DTOs, this record has no Jakarta validation annotations -
 * validation is handled by {@link QuotationInvoiceGuard}.
 * <p>
 * Similar pattern: {@link com.wellkorea.backend.delivery.domain.DeliveryLineItemInput}
 *
 * @param productId        Product ID to invoice
 * @param productName      Product name (denormalized for historical accuracy)
 * @param productSku       Product SKU (optional)
 * @param quantityInvoiced Quantity to invoice
 * @param unitPrice        Unit price from quotation
 */
public record InvoiceLineItemInput(
        Long productId,
        String productName,
        String productSku,
        BigDecimal quantityInvoiced,
        BigDecimal unitPrice
) {
    /**
     * Compact constructor for null checks.
     */
    public InvoiceLineItemInput {
        if (productId == null) {
            throw new IllegalArgumentException("productId must not be null");
        }
        if (productName == null || productName.isBlank()) {
            throw new IllegalArgumentException("productName must not be null or blank");
        }
        if (quantityInvoiced == null) {
            throw new IllegalArgumentException("quantityInvoiced must not be null");
        }
        if (unitPrice == null) {
            throw new IllegalArgumentException("unitPrice must not be null");
        }
    }
}
