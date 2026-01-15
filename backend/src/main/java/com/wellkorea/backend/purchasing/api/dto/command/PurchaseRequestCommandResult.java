package com.wellkorea.backend.purchasing.api.dto.command;

/**
 * Command result DTO for purchase request operations.
 */
public record PurchaseRequestCommandResult(
        Long id,
        String message
) {
    public static PurchaseRequestCommandResult created(Long id) {
        return new PurchaseRequestCommandResult(id, "Purchase request created successfully");
    }

    public static PurchaseRequestCommandResult updated(Long id) {
        return new PurchaseRequestCommandResult(id, "Purchase request updated successfully");
    }

    public static PurchaseRequestCommandResult rfqSent(Long id, int vendorCount) {
        return new PurchaseRequestCommandResult(id, "RFQ sent to " + vendorCount + " vendors");
    }

    public static PurchaseRequestCommandResult canceled(Long id) {
        return new PurchaseRequestCommandResult(id, "Purchase request canceled successfully");
    }
}
