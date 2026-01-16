package com.wellkorea.backend.catalog.application;

import java.math.BigDecimal;

/**
 * Internal command for creating a material.
 */
public record CreateMaterialCommand(
        String sku,
        String name,
        String description,
        Long categoryId,
        String unit,
        BigDecimal standardPrice,
        Long preferredVendorId
) {
}
