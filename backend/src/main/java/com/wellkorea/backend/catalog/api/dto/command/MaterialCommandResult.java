package com.wellkorea.backend.catalog.api.dto.command;

/**
 * Command result DTO for material operations.
 */
public record MaterialCommandResult(
        Long id,
        String message
) {
    public static MaterialCommandResult created(Long id) {
        return new MaterialCommandResult(id, "Material created successfully");
    }

    public static MaterialCommandResult updated(Long id) {
        return new MaterialCommandResult(id, "Material updated successfully");
    }
}
