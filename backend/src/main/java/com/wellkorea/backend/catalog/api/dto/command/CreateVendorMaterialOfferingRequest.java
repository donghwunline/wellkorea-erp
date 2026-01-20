package com.wellkorea.backend.catalog.api.dto.command;

import com.wellkorea.backend.catalog.application.CreateVendorMaterialOfferingCommand;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for creating a vendor material offering.
 */
public record CreateVendorMaterialOfferingRequest(
        @NotNull(message = "Vendor ID is required")
        Long vendorId,

        @NotNull(message = "Material ID is required")
        Long materialId,

        @Size(max = 50, message = "Vendor material code must be at most 50 characters")
        String vendorMaterialCode,

        String vendorMaterialName,

        @PositiveOrZero(message = "Unit price must be zero or positive")
        BigDecimal unitPrice,

        @Size(max = 3, message = "Currency must be at most 3 characters")
        String currency,

        @PositiveOrZero(message = "Lead time days must be zero or positive")
        Integer leadTimeDays,

        @PositiveOrZero(message = "Min order quantity must be zero or positive")
        Integer minOrderQuantity,

        LocalDate effectiveFrom,

        LocalDate effectiveTo,

        Boolean isPreferred,

        String notes
) {
    /**
     * Convert to internal command.
     */
    public CreateVendorMaterialOfferingCommand toCommand() {
        return new CreateVendorMaterialOfferingCommand(
                vendorId,
                materialId,
                vendorMaterialCode,
                vendorMaterialName,
                unitPrice,
                currency != null ? currency : "KRW",
                leadTimeDays,
                minOrderQuantity,
                effectiveFrom,
                effectiveTo,
                isPreferred != null && isPreferred,
                notes
        );
    }
}
