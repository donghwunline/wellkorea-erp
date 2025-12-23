package com.wellkorea.backend.catalog.api.dto.query;

import com.wellkorea.backend.catalog.domain.VendorServiceOffering;

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
    /**
     * Create from entity.
     */
    public static VendorServiceOfferingView from(VendorServiceOffering offering) {
        return new VendorServiceOfferingView(
                offering.getId(),
                offering.getVendor().getId(),
                offering.getVendor().getName(),
                offering.getServiceCategory().getId(),
                offering.getServiceCategory().getName(),
                offering.getVendorServiceCode(),
                offering.getVendorServiceName(),
                offering.getUnitPrice(),
                offering.getCurrency(),
                offering.getLeadTimeDays(),
                offering.getMinOrderQuantity(),
                offering.getEffectiveFrom(),
                offering.getEffectiveTo(),
                offering.isPreferred(),
                offering.getNotes(),
                offering.getCreatedAt(),
                offering.getUpdatedAt()
        );
    }
}
