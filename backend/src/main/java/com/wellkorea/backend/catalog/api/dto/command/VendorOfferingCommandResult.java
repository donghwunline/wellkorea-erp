package com.wellkorea.backend.catalog.api.dto.command;

/**
 * Command result for vendor service offering operations.
 * CQRS pattern: commands return only ID, clients fetch fresh data via query endpoints.
 */
public record VendorOfferingCommandResult(
        Long id,
        String message
) {
    /**
     * Factory method for creation.
     */
    public static VendorOfferingCommandResult created(Long id) {
        return new VendorOfferingCommandResult(id, "Vendor offering created successfully");
    }

    /**
     * Factory method for update.
     */
    public static VendorOfferingCommandResult updated(Long id) {
        return new VendorOfferingCommandResult(id, "Vendor offering updated successfully");
    }

    /**
     * Factory method for deletion.
     */
    public static VendorOfferingCommandResult deleted(Long id) {
        return new VendorOfferingCommandResult(id, "Vendor offering deleted successfully");
    }
}
