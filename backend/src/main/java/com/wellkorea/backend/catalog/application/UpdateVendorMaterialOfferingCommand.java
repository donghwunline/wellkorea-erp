package com.wellkorea.backend.catalog.application;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Internal command for vendor material offering update.
 */
public record UpdateVendorMaterialOfferingCommand(
        String vendorMaterialCode,
        String vendorMaterialName,
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
