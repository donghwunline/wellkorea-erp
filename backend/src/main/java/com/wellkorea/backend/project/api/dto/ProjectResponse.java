package com.wellkorea.backend.project.api.dto;

import com.wellkorea.backend.project.domain.Project;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Response DTO for project data.
 * Transforms Project entity to API response format.
 */
public record ProjectResponse(
        Long id,
        String jobCode,
        Long customerId,
        String projectName,
        String requesterName,
        LocalDate dueDate,
        Long internalOwnerId,
        String status,
        Long createdById,
        Instant createdAt,
        Instant updatedAt
) {

    /**
     * Factory method to create response from Project entity.
     *
     * @param project Project entity
     * @return ProjectResponse DTO
     */
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getJobCode(),
                project.getCustomerId(),
                project.getProjectName(),
                project.getRequesterName(),
                project.getDueDate(),
                project.getInternalOwnerId(),
                project.getStatus().name(),
                project.getCreatedById(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
