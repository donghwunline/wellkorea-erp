package com.wellkorea.erp.domain.jobcode;

import com.wellkorea.erp.domain.customer.Customer;
import com.wellkorea.erp.domain.shared.AuditableEntity;
import com.wellkorea.erp.domain.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * JobCode aggregate root - single source of truth for projects
 * Format: WK2{year}-{sequence}-{date}
 */
@Entity
@Table(name = "jobcodes", indexes = {
        @Index(name = "idx_jobcodes_jobcode", columnList = "jobcode", unique = true),
        @Index(name = "idx_jobcodes_customer_id", columnList = "customer_id"),
        @Index(name = "idx_jobcodes_owner_id", columnList = "internal_owner_id"),
        @Index(name = "idx_jobcodes_status", columnList = "status"),
        @Index(name = "idx_jobcodes_created_at", columnList = "created_at")
})
public class JobCode extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "jobcode", nullable = false, unique = true, length = 50)
    private String jobcode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "requester")
    private String requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "internal_owner_id")
    private User internalOwner;

    @Column(name = "requested_due_date")
    private LocalDate requestedDueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private JobCodeStatus status = JobCodeStatus.DRAFT;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    protected JobCode() {
        // JPA requires default constructor
    }

    public JobCode(String jobcode, Customer customer, String projectName) {
        this.jobcode = jobcode;
        this.customer = customer;
        this.projectName = projectName;
        this.status = JobCodeStatus.DRAFT;
    }

    public void activate() {
        this.status = JobCodeStatus.ACTIVE;
    }

    public void startProgress() {
        if (this.status == JobCodeStatus.ACTIVE) {
            this.status = JobCodeStatus.IN_PROGRESS;
        }
    }

    public void complete() {
        this.status = JobCodeStatus.COMPLETED;
    }

    public void cancel() {
        this.status = JobCodeStatus.CANCELLED;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public String getJobcode() {
        return jobcode;
    }

    public void setJobcode(String jobcode) {
        this.jobcode = jobcode;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getRequester() {
        return requester;
    }

    public void setRequester(String requester) {
        this.requester = requester;
    }

    public User getInternalOwner() {
        return internalOwner;
    }

    public void setInternalOwner(User internalOwner) {
        this.internalOwner = internalOwner;
    }

    public LocalDate getRequestedDueDate() {
        return requestedDueDate;
    }

    public void setRequestedDueDate(LocalDate requestedDueDate) {
        this.requestedDueDate = requestedDueDate;
    }

    public JobCodeStatus getStatus() {
        return status;
    }

    public void setStatus(JobCodeStatus status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public void setId(UUID id) {
        this.id = id;
    }
}
