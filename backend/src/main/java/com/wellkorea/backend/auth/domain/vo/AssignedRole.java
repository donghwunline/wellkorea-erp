package com.wellkorea.backend.auth.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.Instant;
import java.util.Objects;

/**
 * Embeddable class representing a role assignment with timestamp.
 * Used in User entity via @ElementCollection to persist to user_roles table.
 * <p>
 * This class enables JPA to automatically manage the user_roles junction table
 * without requiring manual SQL or custom repository code.
 * <p>
 * The role is stored as VARCHAR in the database using the role name (e.g., "ADMIN", "FINANCE").
 * The assigned_at timestamp tracks when this role was assigned to the user.
 */
@Embeddable
public class AssignedRole {

    /**
     * The role assigned to the user.
     * Stored as VARCHAR(50) in user_roles.role_name column.
     * Maps to roles.name via foreign key constraint for referential integrity.
     */
    @Column(name = "role_name", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Role role;

    /**
     * Timestamp when this role was assigned.
     * Set to current time when the AssignedRole is created.
     * Updated whenever the role set is modified.
     */
    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    /**
     * Default constructor for JPA.
     * Required by JPA specification for embeddable classes.
     */
    protected AssignedRole() {
        // JPA constructor
    }

    /**
     * Create a new role assignment with current timestamp.
     *
     * @param role The role to assign
     */
    public AssignedRole(Role role) {
        this.role = Objects.requireNonNull(role, "Role cannot be null");
        this.assignedAt = Instant.now();
    }

    /**
     * Get the assigned role.
     *
     * @return The role
     */
    public Role getRole() {
        return role;
    }

    /**
     * Get the timestamp when this role was assigned.
     *
     * @return The assignment timestamp
     */
    public Instant getAssignedAt() {
        return assignedAt;
    }

    /**
     * Two AssignedRole objects are equal if they have the same role.
     * The assigned_at timestamp is not considered for equality.
     * This allows Set operations to work correctly based on role alone.
     *
     * @param o Object to compare
     * @return true if roles are equal
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AssignedRole)) return false;
        AssignedRole that = (AssignedRole) o;
        return role == that.role;
    }

    /**
     * Hash code based on role only (consistent with equals).
     *
     * @return Hash code
     */
    @Override
    public int hashCode() {
        return Objects.hash(role);
    }

    /**
     * String representation for debugging.
     *
     * @return String representation
     */
    @Override
    public String toString() {
        return "AssignedRole{" +
                "role=" + role +
                ", assignedAt=" + assignedAt +
                '}';
    }
}
