package com.wellkorea.backend.catalog.api.dto.command;

import com.wellkorea.backend.catalog.application.UpdateMaterialCategoryCommand;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating a material category.
 */
public record UpdateMaterialCategoryRequest(
        @Size(max = 100, message = "Name must not exceed 100 characters")
        String name,

        String description,

        Boolean active
) {
    public UpdateMaterialCategoryCommand toCommand() {
        return new UpdateMaterialCategoryCommand(name, description, active);
    }
}
