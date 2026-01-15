package com.wellkorea.backend.purchasing.api.dto.command;

/**
 * Command result DTO for purchase order operations.
 */
public record PurchaseOrderCommandResult(
        Long id,
        String message
) {
    public static PurchaseOrderCommandResult created(Long id) {
        return new PurchaseOrderCommandResult(id, "Purchase order created successfully");
    }

    public static PurchaseOrderCommandResult updated(Long id) {
        return new PurchaseOrderCommandResult(id, "Purchase order updated successfully");
    }

    public static PurchaseOrderCommandResult sent(Long id) {
        return new PurchaseOrderCommandResult(id, "Purchase order sent to vendor");
    }

    public static PurchaseOrderCommandResult confirmed(Long id) {
        return new PurchaseOrderCommandResult(id, "Purchase order confirmed by vendor");
    }

    public static PurchaseOrderCommandResult received(Long id) {
        return new PurchaseOrderCommandResult(id, "Purchase order marked as received");
    }

    public static PurchaseOrderCommandResult canceled(Long id) {
        return new PurchaseOrderCommandResult(id, "Purchase order canceled successfully");
    }
}
