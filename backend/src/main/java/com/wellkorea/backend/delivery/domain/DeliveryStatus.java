package com.wellkorea.backend.delivery.domain;

/**
 * Status enum for deliveries.
 * <p>
 * Status transitions:
 * - PENDING → DELIVERED (normal delivery flow)
 * - DELIVERED → RETURNED (product return)
 * - PENDING → RETURNED (cancelled before delivery)
 */
public enum DeliveryStatus {
    /**
     * Delivery is scheduled but not yet completed.
     */
    PENDING("Pending"),

    /**
     * Products have been delivered to customer.
     */
    DELIVERED("Delivered"),

    /**
     * Products were returned (for tracking refunds/corrections).
     */
    RETURNED("Returned");

    private final String displayName;

    DeliveryStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Check if status transition is allowed.
     *
     * @param newStatus Target status
     * @return true if transition is valid
     */
    public boolean canTransitionTo(DeliveryStatus newStatus) {
        if (newStatus == null || newStatus == this) {
            return false;
        }
        return switch (this) {
            case PENDING -> newStatus == DELIVERED || newStatus == RETURNED;
            case DELIVERED -> newStatus == RETURNED;
            case RETURNED -> false; // Terminal state
        };
    }
}
