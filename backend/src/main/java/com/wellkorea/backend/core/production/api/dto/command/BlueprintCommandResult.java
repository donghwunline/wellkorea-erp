package com.wellkorea.backend.core.production.api.dto.command;

/**
 * Command result for blueprint attachment operations.
 */
public record BlueprintCommandResult(
        Long id,
        String message
) {
    public static BlueprintCommandResult uploaded(Long id) {
        return new BlueprintCommandResult(id, "Blueprint attachment uploaded successfully");
    }

    public static BlueprintCommandResult deleted(Long id) {
        return new BlueprintCommandResult(id, "Blueprint attachment deleted successfully");
    }
}
