package com.wellkorea.backend.project.api.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Request DTO for updating an existing project.
 * All fields are optional - only provided fields will be updated.
 * Note: JobCode cannot be changed via update.
 */
public record UpdateProjectRequest(
        @Size(max = 255, message = "Project name must not exceed 255 characters")
        String projectName,

        @Size(max = 100, message = "Requester name must not exceed 100 characters")
        String requesterName,

        @FutureOrPresent(message = "Due date must be today or in the future")
        LocalDate dueDate,

        String status
) {
}
