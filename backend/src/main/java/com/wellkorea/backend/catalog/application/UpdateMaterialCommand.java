package com.wellkorea.backend.catalog.application;

import java.math.BigDecimal;

/**
 * Internal command for updating a material.
 */
public record UpdateMaterialCommand(
        String name,
        String description,
        Long categoryId,
        String unit,
        BigDecimal standardPrice,
        Long preferredVendorId,
        Boolean active
) {
}
