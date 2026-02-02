package com.wellkorea.backend.core.product.application;

import java.math.BigDecimal;

/**
 * Internal command for product update.
 */
public record UpdateProductCommand(
        String sku,
        String name,
        String description,
        Long productTypeId,
        BigDecimal baseUnitPrice,
        String unit,
        Boolean isActive
) {
}
