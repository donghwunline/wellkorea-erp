package com.wellkorea.backend.catalog.api.dto.query;

import com.wellkorea.backend.catalog.domain.ServiceCategory;

import java.time.LocalDateTime;

/**
 * View DTO for full service category details.
 */
public record ServiceCategoryDetailView(
        Long id,
        String name,
        String description,
        boolean isActive,
        int vendorCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    /**
     * Create from entity.
     */
    public static ServiceCategoryDetailView from(ServiceCategory category) {
        return new ServiceCategoryDetailView(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isActive(),
                category.getVendorOfferings() != null ? category.getVendorOfferings().size() : 0,
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }

    /**
     * Create from entity with vendor count.
     */
    public static ServiceCategoryDetailView from(ServiceCategory category, int vendorCount) {
        return new ServiceCategoryDetailView(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isActive(),
                vendorCount,
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
