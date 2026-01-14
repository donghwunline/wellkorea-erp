package com.wellkorea.backend.invoice.api.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a new tax invoice.
 * <p>
 * The quotationId field explicitly binds the invoice to a specific quotation version,
 * preventing race conditions where the "latest approved" quotation might change
 * between when the user views the data and when they submit the invoice.
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

        @DecimalMin(value = "0.0", message = "Tax rate must be non-negative")
        @DecimalMax(value = "100.0", message = "Tax rate cannot exceed 100%")
        BigDecimal taxRate, // Optional: defaults to 10% if null

        String notes,

        @NotEmpty(message = "At least one line item is required")
        @Valid
        List<InvoiceLineItemRequest> lineItems
) {
    /**
     * Create a request with default tax rate.
     */
    public CreateInvoiceRequest {
        if (taxRate == null) {
            taxRate = new BigDecimal("10.0");
        }
    }
}
