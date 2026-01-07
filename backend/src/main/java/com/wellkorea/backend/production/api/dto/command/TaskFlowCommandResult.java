package com.wellkorea.backend.production.api.dto.command;

/**
 * Command result DTO for task flow operations (CQRS pattern).
 * Commands return minimal information - just ID and message.
 */
public record TaskFlowCommandResult(
        Long id,
        String message
) {
    public static TaskFlowCommandResult created(Long id) {
        return new TaskFlowCommandResult(id, "Task flow created successfully");
    }

    public static TaskFlowCommandResult saved(Long id) {
        return new TaskFlowCommandResult(id, "Task flow saved successfully");
    }
}
