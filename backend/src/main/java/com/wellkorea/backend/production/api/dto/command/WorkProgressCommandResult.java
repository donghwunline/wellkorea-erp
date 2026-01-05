package com.wellkorea.backend.production.api.dto.command;

/**
 * Command result DTO for work progress operations (CQRS pattern).
 * Commands return minimal information - just ID and message.
 */
public record WorkProgressCommandResult(
        Long id,
        String message
) {
    public static WorkProgressCommandResult created(Long id) {
        return new WorkProgressCommandResult(id, "Work progress sheet created successfully");
    }

    public static WorkProgressCommandResult updated(Long id) {
        return new WorkProgressCommandResult(id, "Step updated successfully");
    }

    public static WorkProgressCommandResult deleted(Long id) {
        return new WorkProgressCommandResult(id, "Work progress sheet deleted successfully");
    }
}
