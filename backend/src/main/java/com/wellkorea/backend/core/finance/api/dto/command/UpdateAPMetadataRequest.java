package com.wellkorea.backend.core.finance.api.dto.command;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * Request DTO for updating accounts payable metadata (due date, notes).
 */
public record UpdateAPMetadataRequest(
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate dueDate,
        String notes
) {}
