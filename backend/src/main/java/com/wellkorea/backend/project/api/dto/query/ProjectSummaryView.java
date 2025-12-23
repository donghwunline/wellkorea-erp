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
    /**
     * Factory method to create summary view.
     *
     * @param id Project ID
     * @param jobCode Job code
     * @param customerId Customer ID
     * @param customerName Resolved customer name
     * @param projectName Project name
     * @param dueDate Due date
     * @param status Project status
     * @param createdAt Created timestamp
     * @param updatedAt Updated timestamp
     * @return ProjectSummaryView
     */
    public static ProjectSummaryView of(
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
        return new ProjectSummaryView(
                id,
                jobCode,
                customerId,
                customerName,
                projectName,
                dueDate,
                status,
                createdAt,
                updatedAt
        );
    }
}
