package com.wellkorea.backend.catalog.api.dto.command;

import com.wellkorea.backend.catalog.application.CreateServiceCategoryCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a service category.
 */
public record CreateServiceCategoryRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        String description
) {
    /**
     * Convert to internal command.
     */
    public CreateServiceCategoryCommand toCommand() {
        return new CreateServiceCategoryCommand(name, description);
    }
}
