package com.wellkorea.backend.catalog.application;

/**
 * Internal command for creating a material category.
 */
public record CreateMaterialCategoryCommand(
        String name,
        String description
) {
}
