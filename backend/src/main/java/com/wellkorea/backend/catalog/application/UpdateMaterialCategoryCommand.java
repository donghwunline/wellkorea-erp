package com.wellkorea.backend.catalog.application;

/**
 * Internal command for updating a material category.
 */
public record UpdateMaterialCategoryCommand(
        String name,
        String description,
        Boolean active
) {
}
