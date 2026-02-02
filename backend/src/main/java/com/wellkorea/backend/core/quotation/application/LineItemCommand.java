package com.wellkorea.backend.core.quotation.application;

import java.math.BigDecimal;

/**
 * Command for a line item.
 */
public record LineItemCommand(
        Long productId,
        BigDecimal quantity,
        BigDecimal unitPrice,
        String notes
) {
}
