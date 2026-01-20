package com.wellkorea.backend.catalog.api.dto.command;

/**
 * Result DTO for vendor material offering command operations.
 * CQRS pattern - commands return only IDs; clients fetch fresh data via query endpoints.
 */
public record VendorMaterialOfferingCommandResult(
        Long id,
        String message
) {
    public static VendorMaterialOfferingCommandResult created(Long id) {
        return new VendorMaterialOfferingCommandResult(id, "Vendor material offering created successfully");
    }

    public static VendorMaterialOfferingCommandResult updated(Long id) {
        return new VendorMaterialOfferingCommandResult(id, "Vendor material offering updated successfully");
    }

    public static VendorMaterialOfferingCommandResult deleted(Long id) {
        return new VendorMaterialOfferingCommandResult(id, "Vendor material offering deleted successfully");
    }
}
