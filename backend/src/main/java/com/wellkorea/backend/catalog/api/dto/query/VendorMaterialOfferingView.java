package com.wellkorea.backend.catalog.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * View DTO for vendor material offering.
 */
public record VendorMaterialOfferingView(
        Long id,
        Long vendorId,
        String vendorName,
        String vendorEmail,
        Long materialId,
        String materialName,
        String materialSku,
        String vendorMaterialCode,
        String vendorMaterialName,
        BigDecimal unitPrice,
        String currency,
        Integer leadTimeDays,
        Integer minOrderQuantity,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        boolean isPreferred,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
