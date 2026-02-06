package com.wellkorea.backend.core.quotation.application;

import java.math.BigDecimal;
import java.util.List;

/**
 * Command for updating a quotation.
 */
public record UpdateQuotationCommand(
        Integer validityDays,
        BigDecimal taxRate,
        BigDecimal discountAmount,
        String notes,
        List<LineItemCommand> lineItems
) {
}
