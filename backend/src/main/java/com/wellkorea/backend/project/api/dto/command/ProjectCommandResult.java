package com.wellkorea.backend.project.api.dto.command;

/**
 * Result DTO for project command operations.
 * Returns entity ID and message. For create operations, also includes the generated jobCode
 * since it's an auto-generated value the user needs to see immediately.
 */
public record ProjectCommandResult(
        Long id,
        String message,
        String jobCode
) {
    /**
     * Create result for project creation - includes generated jobCode.
     */
    public static ProjectCommandResult created(Long id, String jobCode) {
        return new ProjectCommandResult(id, "Project created successfully", jobCode);
    }

    /**
     * Create result for project update - no jobCode needed.
     */
    public static ProjectCommandResult updated(Long id) {
        return new ProjectCommandResult(id, "Project updated successfully", null);
    }

    /**
     * Create result for project deletion - no jobCode needed.
     */
    public static ProjectCommandResult deleted(Long id) {
        return new ProjectCommandResult(id, "Project deleted successfully", null);
    }
}
