package com.wellkorea.backend.catalog.api.dto.command;

import com.wellkorea.backend.catalog.application.UpdateMaterialCommand;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request DTO for updating a material.
 */
public record UpdateMaterialRequest(
        @Size(max = 200, message = "Name must not exceed 200 characters")
        String name,

        String description,

        Long categoryId,

        @Size(max = 20, message = "Unit must not exceed 20 characters")
        String unit,

        BigDecimal standardPrice,

        Long preferredVendorId,

        Boolean active
) {
    public UpdateMaterialCommand toCommand() {
        return new UpdateMaterialCommand(
                name,
                description,
                categoryId,
                unit,
                standardPrice,
                preferredVendorId,
                active
        );
    }
}
