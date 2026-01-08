package com.wellkorea.backend.invoice.api.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a new tax invoice.
 */
public record CreateInvoiceRequest(
        @NotNull(message = "Project ID is required")
        Long projectId,

        Long deliveryId, // Optional: link to specific delivery for auto-population

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
