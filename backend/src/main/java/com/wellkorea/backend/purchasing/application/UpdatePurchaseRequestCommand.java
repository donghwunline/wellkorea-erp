package com.wellkorea.backend.purchasing.application;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Internal command for updating a purchase request.
 */
public record UpdatePurchaseRequestCommand(
        String description,
        BigDecimal quantity,
        String uom,
        LocalDate requiredDate
) {
}
