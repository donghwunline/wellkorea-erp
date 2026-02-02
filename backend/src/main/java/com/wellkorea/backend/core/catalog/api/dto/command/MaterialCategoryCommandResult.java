package com.wellkorea.backend.core.catalog.api.dto.command;

/**
 * Command result DTO for material category operations.
 */
public record MaterialCategoryCommandResult(
        Long id,
        String message
) {
    public static MaterialCategoryCommandResult created(Long id) {
        return new MaterialCategoryCommandResult(id, "Material category created successfully");
    }

    public static MaterialCategoryCommandResult updated(Long id) {
        return new MaterialCategoryCommandResult(id, "Material category updated successfully");
    }
}
