package com.wellkorea.backend.core.finance.api.dto.command;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Request DTO for updating accounts payable metadata (due date, notes).
 */
public record UpdateAPMetadataRequest(
        LocalDate dueDate,  // Jackson handles ISO-8601 by default for JSON
        @Size(max = 2000, message = "Notes must be at most 2000 characters")
        String notes
) {
}
