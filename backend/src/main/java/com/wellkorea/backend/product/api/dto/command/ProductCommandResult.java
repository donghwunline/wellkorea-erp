package com.wellkorea.backend.product.api.dto.command;

/**
 * Command result for product operations.
 * CQRS pattern: commands return only ID, clients fetch fresh data via query endpoints.
 */
public record ProductCommandResult(
        Long id,
        String message
) {
    /**
     * Factory method for product creation.
     */
    public static ProductCommandResult created(Long id) {
        return new ProductCommandResult(id, "Product created successfully");
    }

    /**
     * Factory method for product update.
     */
    public static ProductCommandResult updated(Long id) {
        return new ProductCommandResult(id, "Product updated successfully");
    }

    /**
     * Factory method for product deletion/deactivation.
     */
    public static ProductCommandResult deleted(Long id) {
        return new ProductCommandResult(id, "Product deactivated successfully");
    }
}
