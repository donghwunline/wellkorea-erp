package com.wellkorea.backend.catalog.application;

/**
 * Internal command for service category creation.
 */
public record CreateServiceCategoryCommand(
        String name,
        String description
) {
}
