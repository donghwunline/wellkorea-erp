package com.wellkorea.backend.catalog.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * View DTO for vendor service offering.
 */
public record VendorServiceOfferingView(
        Long id,
        Long vendorId,
        String vendorName,
        Long serviceCategoryId,
        String serviceCategoryName,
        String vendorServiceCode,
        String vendorServiceName,
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
