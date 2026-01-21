package com.wellkorea.backend.quotation.api.dto.query;

import java.math.BigDecimal;

/**
 * Read model for quotation line item.
 * Used in QuotationDetailView for displaying line item details.
 */
public record LineItemView(
        Long id,
        Long productId,
        String productSku,
        String productName,
        String specification,
        String unit,
        Integer sequence,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        String notes
) {
}
