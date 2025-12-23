package com.wellkorea.backend.project.api.dto.query;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.project.domain.Project;
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
    /**
     * Factory method to create view from domain entities.
     *
     * @param project Project entity
     * @param customer Company entity (customer)
     * @param internalOwner User entity (internal owner)
     * @param createdBy User entity (created by)
     * @return ProjectDetailView with resolved names
     */
    public static ProjectDetailView from(
            Project project,
            Company customer,
            User internalOwner,
            User createdBy
    ) {
        return new ProjectDetailView(
                project.getId(),
                project.getJobCode(),
                project.getCustomerId(),
                customer != null ? customer.getName() : null,
                project.getProjectName(),
                project.getRequesterName(),
                project.getDueDate(),
                project.getInternalOwnerId(),
                internalOwner != null ? internalOwner.getFullName() : null,
                project.getStatus(),
                project.getCreatedById(),
                createdBy != null ? createdBy.getFullName() : null,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
