package com.wellkorea.backend.catalog.application;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Internal command for vendor service offering update.
 */
public record UpdateVendorOfferingCommand(
        String vendorServiceCode,
        String vendorServiceName,
        BigDecimal unitPrice,
        String currency,
        Integer leadTimeDays,
        Integer minOrderQuantity,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        Boolean isPreferred,
        String notes
) {
}
