package com.wellkorea.backend.purchasing.application;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Internal command for creating a purchase request.
 */
public record CreatePurchaseRequestCommand(
        Long projectId,
        Long serviceCategoryId,
        String description,
        BigDecimal quantity,
        String uom,
        LocalDate requiredDate
) {
}
