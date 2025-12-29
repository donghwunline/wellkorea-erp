package com.wellkorea.backend.catalog.api.dto.query;

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
}
