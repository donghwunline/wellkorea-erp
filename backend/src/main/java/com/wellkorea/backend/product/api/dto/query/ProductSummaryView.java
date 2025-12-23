package com.wellkorea.backend.product.api.dto.query;

import com.wellkorea.backend.product.domain.Product;

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
    /**
     * Create from entity.
     */
    public static ProductSummaryView from(Product product) {
        return new ProductSummaryView(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getDescription(),
                product.getProductType().getId(),
                product.getProductType().getName(),
                product.getBaseUnitPrice(),
                product.getUnit(),
                product.isActive()
        );
    }
}
