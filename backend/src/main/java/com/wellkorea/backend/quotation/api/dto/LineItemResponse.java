package com.wellkorea.backend.quotation.api.dto;

import com.wellkorea.backend.quotation.domain.QuotationLineItem;
import java.math.BigDecimal;

/**
 * Response DTO for a quotation line item.
 */
public record LineItemResponse(
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
    public static LineItemResponse from(QuotationLineItem lineItem) {
        return new LineItemResponse(
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
