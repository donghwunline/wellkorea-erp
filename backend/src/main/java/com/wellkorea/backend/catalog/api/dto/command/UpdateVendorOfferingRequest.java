package com.wellkorea.backend.catalog.api.dto.command;

import com.wellkorea.backend.catalog.application.UpdateVendorOfferingCommand;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for updating a vendor service offering.
 */
public record UpdateVendorOfferingRequest(
        @Size(max = 50, message = "Vendor service code must be at most 50 characters")
        String vendorServiceCode,

        String vendorServiceName,

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
    public UpdateVendorOfferingCommand toCommand() {
        return new UpdateVendorOfferingCommand(
                vendorServiceCode,
                vendorServiceName,
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
