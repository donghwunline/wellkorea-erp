package com.wellkorea.backend.catalog.api.dto.query;

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
}
