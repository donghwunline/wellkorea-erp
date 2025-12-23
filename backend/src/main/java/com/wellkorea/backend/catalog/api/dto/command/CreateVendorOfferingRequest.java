package com.wellkorea.backend.catalog.api.dto.command;

import com.wellkorea.backend.catalog.application.CreateVendorOfferingCommand;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for creating a vendor service offering.
 */
public record CreateVendorOfferingRequest(
        @NotNull(message = "Vendor ID is required")
        Long vendorId,

        @NotNull(message = "Service category ID is required")
        Long serviceCategoryId,

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
    public CreateVendorOfferingCommand toCommand() {
        return new CreateVendorOfferingCommand(
                vendorId,
                serviceCategoryId,
                vendorServiceCode,
                vendorServiceName,
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
