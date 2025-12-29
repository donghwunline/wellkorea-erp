package com.wellkorea.backend.catalog.application;

/**
 * Internal command for service category update.
 */
public record UpdateServiceCategoryCommand(
        String name,
        String description,
        Boolean isActive
) {
}
