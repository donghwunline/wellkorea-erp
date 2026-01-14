package com.wellkorea.backend.invoice.api.dto.query;

import java.math.BigDecimal;

/**
 * View DTO for invoice line item.
 */
public record InvoiceLineItemView(
        Long id,
        Long productId,
        String productName,
        String productSku,
        BigDecimal quantityInvoiced,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
