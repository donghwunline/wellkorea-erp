package com.wellkorea.backend.core.catalog.api.dto.command;

import com.wellkorea.backend.core.catalog.application.CreateMaterialCategoryCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a material category.
 */
public record CreateMaterialCategoryRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must not exceed 100 characters")
        String name,

        String description
) {
    public CreateMaterialCategoryCommand toCommand() {
        return new CreateMaterialCategoryCommand(name, description);
    }
}
