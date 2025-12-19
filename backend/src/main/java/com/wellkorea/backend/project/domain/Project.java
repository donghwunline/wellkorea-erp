package com.wellkorea.backend.project.domain;

import jakarta.annotation.Nonnull;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Project entity - the core domain aggregate.
 * JobCode is the unique business identifier for customer requests.
 * <p>
 * A Project links all related business activities:
 * - Quotations
 * - Production tracking
 * - Delivery records
 * - Invoices
 * - Financial records
 * <p>
 * JobCode format: WK2K{YY}-{SSSS}-{MMDD}
 * Example: WK2K25-0001-0104 (January 4th, 2025, sequence 1)
 */
@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_code", nullable = false, unique = true, length = 20)
    private String jobCode;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "project_name", nullable = false, length = 255)
    private String projectName;

    @Column(name = "requester_name", length = 100)
    private String requesterName;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "internal_owner_id", nullable = false)
    private Long internalOwnerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ProjectStatus status = ProjectStatus.DRAFT;

    @Column(name = "created_by_id", nullable = false)
    private Long createdById;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    protected Project() {
        // JPA requires default constructor
    }

    private Project(Builder builder) {
        this.id = builder.id;
        this.jobCode = builder.jobCode;
        this.customerId = builder.customerId;
        this.projectName = builder.projectName;
        this.requesterName = builder.requesterName;
        this.dueDate = builder.dueDate;
        this.internalOwnerId = builder.internalOwnerId;
        this.status = builder.status != null ? builder.status : ProjectStatus.DRAFT;
        this.createdById = builder.createdById;
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
        this.updatedAt = builder.updatedAt != null ? builder.updatedAt : Instant.now();
        this.isDeleted = builder.isDeleted;
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public String getJobCode() {
        return jobCode;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getProjectName() {
        return projectName;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public Long getInternalOwnerId() {
        return internalOwnerId;
    }

    public ProjectStatus getStatus() {
        return status;
    }

    public Long getCreatedById() {
        return createdById;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public boolean isDeleted() {
        return isDeleted;
    }

    // ========== Domain Methods ==========

    /**
     * Check if project can be edited.
     * Only DRAFT and ACTIVE projects are editable.
     *
     * @return true if editable
     */
    public boolean isEditable() {
        return status.isEditable() && !isDeleted;
    }

    /**
     * Create a copy with new ID.
     * Used after persistence to return entity with generated ID.
     *
     * @param newId Generated ID from database
     * @return New Project instance with ID set
     */
    public Project withId(Long newId) {
        return builder()
                .id(newId)
                .jobCode(this.jobCode)
                .customerId(this.customerId)
                .projectName(this.projectName)
                .requesterName(this.requesterName)
                .dueDate(this.dueDate)
                .internalOwnerId(this.internalOwnerId)
                .status(this.status)
                .createdById(this.createdById)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .isDeleted(this.isDeleted)
                .build();
    }

    /**
     * Create a copy with updated fields.
     * JobCode cannot be changed.
     *
     * @param newProjectName New project name
     * @param newRequesterName New requester name
     * @param newDueDate New due date
     * @param newStatus New status
     * @return New Project instance with updated fields
     */
    public Project withUpdatedFields(String newProjectName, String newRequesterName,
                                     LocalDate newDueDate, ProjectStatus newStatus) {
        return builder()
                .id(this.id)
                .jobCode(this.jobCode) // JobCode cannot be changed
                .customerId(this.customerId)
                .projectName(newProjectName != null ? newProjectName : this.projectName)
                .requesterName(newRequesterName != null ? newRequesterName : this.requesterName)
                .dueDate(newDueDate != null ? newDueDate : this.dueDate)
                .internalOwnerId(this.internalOwnerId)
                .status(newStatus != null ? newStatus : this.status)
                .createdById(this.createdById)
                .createdAt(this.createdAt)
                .updatedAt(Instant.now())
                .isDeleted(this.isDeleted)
                .build();
    }

    /**
     * Create a copy with new status.
     *
     * @param newStatus New project status
     * @return New Project instance with updated status
     * @throws IllegalArgumentException if newStatus is null
     * @throws IllegalStateException if status transition is not allowed
     */
    public Project withStatus(@Nonnull ProjectStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("New status cannot be null");
        }
        if (!this.status.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    "Cannot transition from " + this.status + " to " + newStatus);
        }
        return builder()
                .id(this.id)
                .jobCode(this.jobCode)
                .customerId(this.customerId)
                .projectName(this.projectName)
                .requesterName(this.requesterName)
                .dueDate(this.dueDate)
                .internalOwnerId(this.internalOwnerId)
                .status(newStatus)
                .createdById(this.createdById)
                .createdAt(this.createdAt)
                .updatedAt(Instant.now())
                .isDeleted(this.isDeleted)
                .build();
    }

    /**
     * Soft delete the project.
     *
     * @return New Project instance with isDeleted = true
     */
    public Project delete() {
        return builder()
                .id(this.id)
                .jobCode(this.jobCode)
                .customerId(this.customerId)
                .projectName(this.projectName)
                .requesterName(this.requesterName)
                .dueDate(this.dueDate)
                .internalOwnerId(this.internalOwnerId)
                .status(this.status)
                .createdById(this.createdById)
                .createdAt(this.createdAt)
                .updatedAt(Instant.now())
                .isDeleted(true)
                .build();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Project project = (Project) o;
        return Objects.equals(id, project.id) &&
                Objects.equals(jobCode, project.jobCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, jobCode);
    }

    @Override
    public String toString() {
        return "Project{" +
                "id=" + id +
                ", jobCode='" + jobCode + '\'' +
                ", customerId=" + customerId +
                ", projectName='" + projectName + '\'' +
                ", status=" + status +
                ", dueDate=" + dueDate +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private Long id;
        private String jobCode;
        private Long customerId;
        private String projectName;
        private String requesterName;
        private LocalDate dueDate;
        private Long internalOwnerId;
        private ProjectStatus status;
        private Long createdById;
        private Instant createdAt;
        private Instant updatedAt;
        private boolean isDeleted = false;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder jobCode(String jobCode) {
            this.jobCode = jobCode;
            return this;
        }

        public Builder customerId(Long customerId) {
            this.customerId = customerId;
            return this;
        }

        public Builder projectName(String projectName) {
            this.projectName = projectName;
            return this;
        }

        public Builder requesterName(String requesterName) {
            this.requesterName = requesterName;
            return this;
        }

        public Builder dueDate(LocalDate dueDate) {
            this.dueDate = dueDate;
            return this;
        }

        public Builder internalOwnerId(Long internalOwnerId) {
            this.internalOwnerId = internalOwnerId;
            return this;
        }

        public Builder status(ProjectStatus status) {
            this.status = status;
            return this;
        }

        public Builder createdById(Long createdById) {
            this.createdById = createdById;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Builder isDeleted(boolean isDeleted) {
            this.isDeleted = isDeleted;
            return this;
        }

        public Project build() {
            return new Project(this);
        }
    }
}
