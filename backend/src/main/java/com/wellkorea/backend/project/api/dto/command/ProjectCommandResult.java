package com.wellkorea.backend.project.api.dto.command;

/**
 * Result DTO for project command operations.
 * Returns only the entity ID - clients should fetch fresh data via query endpoints.
 */
public record ProjectCommandResult(
        Long id,
        String message
) {
    public static ProjectCommandResult created(Long id) {
        return new ProjectCommandResult(id, "Project created successfully");
    }

    public static ProjectCommandResult updated(Long id) {
        return new ProjectCommandResult(id, "Project updated successfully");
    }

    public static ProjectCommandResult deleted(Long id) {
        return new ProjectCommandResult(id, "Project deleted successfully");
    }
}
