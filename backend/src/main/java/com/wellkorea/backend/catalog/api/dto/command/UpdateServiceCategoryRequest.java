package com.wellkorea.backend.catalog.api.dto.command;

import com.wellkorea.backend.catalog.application.UpdateServiceCategoryCommand;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating a service category.
 */
public record UpdateServiceCategoryRequest(
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        String description,

        Boolean isActive
) {
    /**
     * Convert to internal command.
     */
    public UpdateServiceCategoryCommand toCommand() {
        return new UpdateServiceCategoryCommand(name, description, isActive);
    }
}
