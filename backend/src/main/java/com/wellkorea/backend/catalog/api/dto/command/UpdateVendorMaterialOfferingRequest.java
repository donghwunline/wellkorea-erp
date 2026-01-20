package com.wellkorea.backend.catalog.api.dto.command;

import com.wellkorea.backend.catalog.application.UpdateVendorMaterialOfferingCommand;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for updating a vendor material offering.
 */
public record UpdateVendorMaterialOfferingRequest(
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
    public UpdateVendorMaterialOfferingCommand toCommand() {
        return new UpdateVendorMaterialOfferingCommand(
                vendorMaterialCode,
                vendorMaterialName,
                unitPrice,
                currency,
                leadTimeDays,
                minOrderQuantity,
                effectiveFrom,
                effectiveTo,
                isPreferred,
                notes
        );
    }
}
