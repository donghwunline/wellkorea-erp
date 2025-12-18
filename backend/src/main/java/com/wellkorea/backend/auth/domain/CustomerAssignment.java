package com.wellkorea.backend.auth.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Customer assignment entity for Sales role filtering per FR-062.
 * <p>
 * Sales users can only access projects and quotations for their assigned customers.
 * This provides customer-level access control for the SALES role.
 * </p>
 */
@Entity
@Table(
    name = "customer_assignments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "customer_id"})
)
public class CustomerAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        if (assignedAt == null) {
            assignedAt = LocalDateTime.now();
        }
    }

    // Default constructor for JPA
    protected CustomerAssignment() {
    }

    // All-args constructor
    public CustomerAssignment(Long id, Long userId, Long customerId, LocalDateTime assignedAt) {
        this.id = id;
        this.userId = userId;
        this.customerId = customerId;
        this.assignedAt = assignedAt;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    // Getters
    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    // Immutable update methods
    public CustomerAssignment withId(Long id) {
        return new CustomerAssignment(id, this.userId, this.customerId, this.assignedAt);
    }

    public CustomerAssignment withUserId(Long userId) {
        return new CustomerAssignment(this.id, userId, this.customerId, this.assignedAt);
    }

    public CustomerAssignment withCustomerId(Long customerId) {
        return new CustomerAssignment(this.id, this.userId, customerId, this.assignedAt);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CustomerAssignment that = (CustomerAssignment) o;
        return Objects.equals(id, that.id) &&
               Objects.equals(userId, that.userId) &&
               Objects.equals(customerId, that.customerId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, userId, customerId);
    }

    @Override
    public String toString() {
        return "CustomerAssignment{" +
               "id=" + id +
               ", userId=" + userId +
               ", customerId=" + customerId +
               ", assignedAt=" + assignedAt +
               '}';
    }

    // Builder class
    public static class Builder {
        private Long id;
        private Long userId;
        private Long customerId;
        private LocalDateTime assignedAt;

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Builder customerId(Long customerId) {
            this.customerId = customerId;
            return this;
        }

        public Builder assignedAt(LocalDateTime assignedAt) {
            this.assignedAt = assignedAt;
            return this;
        }

        public CustomerAssignment build() {
            return new CustomerAssignment(id, userId, customerId, assignedAt);
        }
    }
}
