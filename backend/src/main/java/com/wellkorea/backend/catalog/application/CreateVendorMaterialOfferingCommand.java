package com.wellkorea.backend.catalog.application;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Internal command for vendor material offering creation.
 */
public record CreateVendorMaterialOfferingCommand(
        Long vendorId,
        Long materialId,
        String vendorMaterialCode,
        String vendorMaterialName,
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
