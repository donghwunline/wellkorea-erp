package com.wellkorea.backend.project.api.dto.query;

import com.wellkorea.backend.project.domain.ProjectStatus;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Read model for project detail views.
 * Includes resolved names for customer, internal owner, and created by user.
 */
public record ProjectDetailView(
        Long id,
        String jobCode,
        Long customerId,
        String customerName,
        String projectName,
        String requesterName,
        LocalDate dueDate,
        Long internalOwnerId,
        String internalOwnerName,
        ProjectStatus status,
        Long createdById,
        String createdByName,
        Instant createdAt,
        Instant updatedAt
) {
}
