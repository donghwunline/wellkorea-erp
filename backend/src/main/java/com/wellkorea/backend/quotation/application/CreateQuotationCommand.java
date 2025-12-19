package com.wellkorea.backend.quotation.application;

import java.util.List;

/**
 * Command for creating a quotation.
 */
public record CreateQuotationCommand(
        Long projectId,
        Integer validityDays,
        String notes,
        List<LineItemCommand> lineItems
) {}
