package com.wellkorea.backend.catalog.api.dto.query;

import com.wellkorea.backend.catalog.domain.ServiceCategory;

/**
 * View DTO for service category summary in list views.
 */
public record ServiceCategorySummaryView(
        Long id,
        String name,
        String description,
        boolean isActive,
        int vendorCount
) {
    /**
     * Create from entity.
     */
    public static ServiceCategorySummaryView from(ServiceCategory category) {
        return new ServiceCategorySummaryView(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isActive(),
                category.getVendorOfferings() != null ? category.getVendorOfferings().size() : 0
        );
    }

    /**
     * Create from entity with vendor count.
     */
    public static ServiceCategorySummaryView from(ServiceCategory category, int vendorCount) {
        return new ServiceCategorySummaryView(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isActive(),
                vendorCount
        );
    }
}
