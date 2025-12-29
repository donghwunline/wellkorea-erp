package com.wellkorea.backend.product.api.dto.query;

import java.math.BigDecimal;

/**
 * View DTO for product summary in list views.
 */
public record ProductSummaryView(
        Long id,
        String sku,
        String name,
        String description,
        Long productTypeId,
        String productTypeName,
        BigDecimal baseUnitPrice,
        String unit,
        boolean isActive
) {
}
