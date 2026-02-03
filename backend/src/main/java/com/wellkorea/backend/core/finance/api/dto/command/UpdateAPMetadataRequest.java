package com.wellkorea.backend.core.finance.api.dto.command;

import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * Request DTO for updating accounts payable metadata (due date, notes).
 */
public record UpdateAPMetadataRequest(
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate dueDate,
        @Size(max = 2000, message = "Notes must be at most 2000 characters")
        String notes
) {}
