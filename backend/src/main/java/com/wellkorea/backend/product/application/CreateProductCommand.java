package com.wellkorea.backend.product.application;

import java.math.BigDecimal;

/**
 * Internal command for product creation.
 */
public record CreateProductCommand(
        String sku,
        String name,
        String description,
        Long productTypeId,
        BigDecimal baseUnitPrice,
        String unit
) {
}
