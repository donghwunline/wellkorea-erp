package com.wellkorea.backend.core.quotation.application;

import java.util.List;

/**
 * Command for updating a quotation.
 */
public record UpdateQuotationCommand(
        Integer validityDays,
        String notes,
        List<LineItemCommand> lineItems
) {
}
