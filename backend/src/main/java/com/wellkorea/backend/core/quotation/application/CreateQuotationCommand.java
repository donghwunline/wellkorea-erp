package com.wellkorea.backend.core.quotation.application;

import java.math.BigDecimal;
import java.util.List;

/**
 * Command for creating a quotation.
 */
public record CreateQuotationCommand(
        Long projectId,
        Integer validityDays,
        BigDecimal taxRate,
        BigDecimal discountAmount,
        String notes,
        List<LineItemCommand> lineItems
) {
}
