package com.wellkorea.backend.core.finance.api.dto.command;

/**
 * Result DTO for accounts payable command operations.
 */
public record APCommandResult(
        Long id,
        String message
) {
    public static APCommandResult updated(Long id) {
        return new APCommandResult(id, "Accounts payable updated successfully");
    }

    public static APCommandResult created(Long id) {
        return new APCommandResult(id, "Accounts payable created successfully");
    }
}
