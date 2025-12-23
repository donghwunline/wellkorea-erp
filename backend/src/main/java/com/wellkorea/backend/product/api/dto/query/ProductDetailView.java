package com.wellkorea.backend.product.api.dto.query;

import com.wellkorea.backend.product.domain.Product;

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
    /**
     * Create from entity.
     */
    public static ProductDetailView from(Product product) {
        return new ProductDetailView(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getDescription(),
                product.getProductType().getId(),
                product.getProductType().getName(),
                product.getBaseUnitPrice(),
                product.getUnit(),
                product.isActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
