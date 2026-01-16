package com.wellkorea.backend.catalog.api.dto.command;

import com.wellkorea.backend.catalog.application.CreateMaterialCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request DTO for creating a material.
 */
public record CreateMaterialRequest(
        @NotBlank(message = "SKU is required")
        @Size(max = 50, message = "SKU must not exceed 50 characters")
        String sku,

        @NotBlank(message = "Name is required")
        @Size(max = 200, message = "Name must not exceed 200 characters")
        String name,

        String description,

        @NotNull(message = "Category ID is required")
        Long categoryId,

        @Size(max = 20, message = "Unit must not exceed 20 characters")
        String unit,

        BigDecimal standardPrice,

        Long preferredVendorId
) {
    public CreateMaterialCommand toCommand() {
        return new CreateMaterialCommand(
                sku,
                name,
                description,
                categoryId,
                unit != null ? unit : "EA",
                standardPrice,
                preferredVendorId
        );
    }
}
