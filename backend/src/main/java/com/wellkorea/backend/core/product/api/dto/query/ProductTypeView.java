package com.wellkorea.backend.core.product.api.dto.query;

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
}
