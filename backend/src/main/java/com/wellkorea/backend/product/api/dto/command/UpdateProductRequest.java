package com.wellkorea.backend.product.api.dto.command;

import com.wellkorea.backend.product.application.UpdateProductCommand;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request DTO for updating a product.
 */
public record UpdateProductRequest(
        @Size(max = 50, message = "SKU must be at most 50 characters")
        String sku,

        @Size(max = 255, message = "Name must be at most 255 characters")
        String name,

        String description,

        Long productTypeId,

        @PositiveOrZero(message = "Base unit price must be zero or positive")
        BigDecimal baseUnitPrice,

        @Size(max = 20, message = "Unit must be at most 20 characters")
        String unit,

        Boolean isActive
) {
    /**
     * Convert to internal command.
     */
    public UpdateProductCommand toCommand() {
        return new UpdateProductCommand(
                sku,
                name,
                description,
                productTypeId,
                baseUnitPrice,
                unit,
                isActive
        );
    }
}
