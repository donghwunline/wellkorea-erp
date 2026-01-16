package com.wellkorea.backend.catalog.api.dto.query;

import java.time.LocalDateTime;

/**
 * View DTO for material category summary in list views.
 */
public record MaterialCategorySummaryView(
        Long id,
        String name,
        String description,
        boolean active,
        int materialCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
