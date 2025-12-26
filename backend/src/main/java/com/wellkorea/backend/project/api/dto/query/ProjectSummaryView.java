package com.wellkorea.backend.project.api.dto.query;

import com.wellkorea.backend.project.domain.ProjectStatus;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Read model for project list views.
 * Optimized for pagination - includes essential fields and customer name.
 */
public record ProjectSummaryView(
        Long id,
        String jobCode,
        Long customerId,
        String customerName,
        String projectName,
        LocalDate dueDate,
        ProjectStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
