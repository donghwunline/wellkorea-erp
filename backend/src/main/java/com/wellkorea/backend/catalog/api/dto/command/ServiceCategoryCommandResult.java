package com.wellkorea.backend.catalog.api.dto.command;

/**
 * Command result for service category operations.
 * CQRS pattern: commands return only ID, clients fetch fresh data via query endpoints.
 */
public record ServiceCategoryCommandResult(
        Long id,
        String message
) {
    /**
     * Factory method for creation.
     */
    public static ServiceCategoryCommandResult created(Long id) {
        return new ServiceCategoryCommandResult(id, "Service category created successfully");
    }

    /**
     * Factory method for update.
     */
    public static ServiceCategoryCommandResult updated(Long id) {
        return new ServiceCategoryCommandResult(id, "Service category updated successfully");
    }

    /**
     * Factory method for deletion/deactivation.
     */
    public static ServiceCategoryCommandResult deleted(Long id) {
        return new ServiceCategoryCommandResult(id, "Service category deactivated successfully");
    }
}
