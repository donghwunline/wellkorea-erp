package com.wellkorea.backend.invoice.api.dto.command;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request DTO for invoice line item.
 */
public record InvoiceLineItemRequest(
        @NotNull(message = "Product ID is required")
        Long productId,

        @NotBlank(message = "Product name is required")
        @Size(max = 255, message = "Product name cannot exceed 255 characters")
        String productName,

        @Size(max = 100, message = "Product SKU cannot exceed 100 characters")
        String productSku,

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.01", message = "Quantity must be positive")
        BigDecimal quantityInvoiced,

        @NotNull(message = "Unit price is required")
        @DecimalMin(value = "0.0", message = "Unit price must be non-negative")
        BigDecimal unitPrice
) {
}
