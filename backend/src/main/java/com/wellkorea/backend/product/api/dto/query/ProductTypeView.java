package com.wellkorea.backend.product.api.dto.query;

import com.wellkorea.backend.product.domain.ProductType;

import java.time.LocalDateTime;

/**
 * View DTO for product type.
 */
public record ProductTypeView(
        Long id,
        String name,
        String description,
        LocalDateTime createdAt
) {
    /**
     * Create from entity.
     */
    public static ProductTypeView from(ProductType productType) {
        return new ProductTypeView(
                productType.getId(),
                productType.getName(),
                productType.getDescription(),
                productType.getCreatedAt()
        );
    }
}
