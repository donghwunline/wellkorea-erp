package com.wellkorea.backend.catalog.application;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Internal command for vendor service offering creation.
 */
public record CreateVendorOfferingCommand(
        Long vendorId,
        Long serviceCategoryId,
        String vendorServiceCode,
        String vendorServiceName,
        BigDecimal unitPrice,
        String currency,
        Integer leadTimeDays,
        Integer minOrderQuantity,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        boolean isPreferred,
        String notes
) {
}
