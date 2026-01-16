package com.wellkorea.backend.catalog.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * View DTO for material details.
 */
public record MaterialDetailView(
        Long id,
        String sku,
        String name,
        String description,
        Long categoryId,
        String categoryName,
        String unit,
        BigDecimal standardPrice,
        Long preferredVendorId,
        String preferredVendorName,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
