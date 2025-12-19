package com.wellkorea.backend.project.api.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * Request DTO for creating a new project.
 * Validates required fields before project creation.
 */
public record CreateProjectRequest(
        @NotNull(message = "Customer ID is required")
        Long customerId,

        @NotBlank(message = "Project name is required")
        @Size(max = 255, message = "Project name must not exceed 255 characters")
        String projectName,

        @Size(max = 100, message = "Requester name must not exceed 100 characters")
        String requesterName,

        @NotNull(message = "Due date is required")
        @FutureOrPresent(message = "Due date must be today or in the future")
        LocalDate dueDate,

        @NotNull(message = "Internal owner ID is required")
        Long internalOwnerId
) {
}
