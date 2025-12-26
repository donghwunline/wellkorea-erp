package com.wellkorea.backend.product.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * View DTO for full product details.
 */
public record ProductDetailView(
        Long id,
        String sku,
        String name,
        String description,
        Long productTypeId,
        String productTypeName,
        BigDecimal baseUnitPrice,
        String unit,
        boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
