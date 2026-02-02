package com.wellkorea.backend.core.catalog.application;

/**
 * Internal command for updating a material category.
 */
public record UpdateMaterialCategoryCommand(
        String name,
        String description,
        Boolean active
) {
}
