package com.wellkorea.backend.core.invoice.api.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a new tax invoice.
 * <p>
 * The quotationId field explicitly binds the invoice to a specific quotation version,
 * preventing race conditions where the "latest approved" quotation might change
 * between when the user views the data and when they submit the invoice.
 * <p>
 * Note: Tax rate is inherited from the quotation.
 * Discount amount is set manually by financial personnel. Defaults to 0 if null.
 * The sum of discountAmount across all non-CANCELLED invoices for a quotation
 * must not exceed the quotation's discountAmount.
 */
public record CreateInvoiceRequest(
        @NotNull(message = "Project ID is required")
        Long projectId,

        @NotNull(message = "Quotation ID is required")
        Long quotationId, // Explicit binding to prevent race conditions

        @NotNull(message = "Issue date is required")
        LocalDate issueDate,

        @NotNull(message = "Due date is required")
        LocalDate dueDate,

        String notes,

        @PositiveOrZero(message = "Discount amount must be non-negative")
        BigDecimal discountAmount, // Optional, defaults to 0

        @NotEmpty(message = "At least one line item is required")
        @Valid
        List<InvoiceLineItemRequest> lineItems
) {
}
