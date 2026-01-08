package com.wellkorea.backend.delivery.api.dto.command;

/**
 * Result of a delivery command operation.
 * Returns only the entity ID - clients should fetch fresh data via query endpoints.
 * This follows CQRS principle of keeping commands and queries separate.
 */
public record DeliveryCommandResult(
        Long id,
        String message
) {
    public static DeliveryCommandResult created(Long id) {
        return new DeliveryCommandResult(id, "Delivery created successfully");
    }

    public static DeliveryCommandResult updated(Long id) {
        return new DeliveryCommandResult(id, "Delivery updated successfully");
    }

    public static DeliveryCommandResult delivered(Long id) {
        return new DeliveryCommandResult(id, "Delivery marked as delivered");
    }

    public static DeliveryCommandResult returned(Long id) {
        return new DeliveryCommandResult(id, "Delivery marked as returned");
    }
}
