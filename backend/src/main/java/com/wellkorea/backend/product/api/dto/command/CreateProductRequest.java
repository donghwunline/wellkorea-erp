package com.wellkorea.backend.product.api.dto.command;

import com.wellkorea.backend.product.application.CreateProductCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request DTO for creating a product.
 */
public record CreateProductRequest(
        @NotBlank(message = "SKU is required")
        @Size(max = 50, message = "SKU must be at most 50 characters")
        String sku,

        @NotBlank(message = "Name is required")
        @Size(max = 255, message = "Name must be at most 255 characters")
        String name,

        String description,

        @NotNull(message = "Product type ID is required")
        Long productTypeId,

        @PositiveOrZero(message = "Base unit price must be zero or positive")
        BigDecimal baseUnitPrice,

        @Size(max = 20, message = "Unit must be at most 20 characters")
        String unit
) {
    /**
     * Convert to internal command.
     */
    public CreateProductCommand toCommand() {
        return new CreateProductCommand(
                sku,
                name,
                description,
                productTypeId,
                baseUnitPrice,
                unit != null ? unit : "EA"
        );
    }
}
