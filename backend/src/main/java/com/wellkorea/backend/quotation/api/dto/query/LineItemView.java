package com.wellkorea.backend.quotation.api.dto.query;

import com.wellkorea.backend.quotation.domain.QuotationLineItem;

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
        Integer sequence,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        String notes
) {
    public static LineItemView from(QuotationLineItem lineItem) {
        return new LineItemView(
                lineItem.getId(),
                lineItem.getProduct().getId(),
                lineItem.getProduct().getSku(),
                lineItem.getProduct().getName(),
                lineItem.getSequence(),
                lineItem.getQuantity(),
                lineItem.getUnitPrice(),
                lineItem.getLineTotal(),
                lineItem.getNotes()
        );
    }
}
