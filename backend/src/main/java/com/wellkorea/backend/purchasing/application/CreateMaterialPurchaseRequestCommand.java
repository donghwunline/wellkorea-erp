package com.wellkorea.backend.purchasing.application;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Internal command for creating a material purchase request (physical items).
 */
public record CreateMaterialPurchaseRequestCommand(
        Long projectId,
        Long materialId,
        String description,
        BigDecimal quantity,
        String uom,
        LocalDate requiredDate
) {
}
