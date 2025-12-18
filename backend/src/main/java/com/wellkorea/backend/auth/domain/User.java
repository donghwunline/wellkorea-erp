package com.wellkorea.backend.auth.domain;

import jakarta.annotation.Nonnull;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * User entity for authentication and authorization.
 * Represents a staff member with login credentials and role assignments.
 * <p>
 * Note: This class uses a builder pattern for test fixtures and immutable-style
 * operations (withId, withActive, etc.) for state changes following DDD principles.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    /**
     * User role assignments with timestamps.
     * Persisted to user_roles junction table via @ElementCollection.
     * JPA automatically manages the junction table for CRUD operations.
     * EAGER fetch ensures roles are always loaded to prevent LazyInitializationException.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id")
    )
    private Set<AssignedRole> roles = new HashSet<>();

    protected User() {
        // JPA requires default constructor
    }

    private User(Builder builder) {
        this.id = builder.id;
        this.username = builder.username;
        this.email = builder.email;
        this.passwordHash = builder.passwordHash;
        this.fullName = builder.fullName;
        this.isActive = builder.isActive;
        this.roles = builder.roles.stream().map(AssignedRole::new).collect(Collectors.toSet());
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
        this.updatedAt = builder.updatedAt != null ? builder.updatedAt : Instant.now();
        this.lastLoginAt = builder.lastLoginAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getFullName() {
        return fullName;
    }

    public boolean isActive() {
        return isActive;
    }

    /**
     * Get user roles as Set<Role> for business logic.
     * Extracts roles from AssignedRole collection.
     *
     * @return Unmodifiable set of roles
     */
    public Set<Role> getRoles() {
        return roles.stream()
                .map(AssignedRole::getRole)
                .collect(Collectors.toUnmodifiableSet());
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    /**
     * Get roles as comma-separated authority string for JWT tokens.
     *
     * @return Comma-separated roles (e.g., "ROLE_ADMIN,ROLE_FINANCE")
     */
    public String getRolesAsString() {
        return roles.stream()
                .map(AssignedRole::getRole)
                .map(Role::getAuthority)
                .sorted()
                .collect(Collectors.joining(","));
    }

    /**
     * Check if user has a specific role.
     *
     * @param role Role to check
     * @return true if user has the role
     */
    public boolean hasRole(Role role) {
        return roles.stream()
                .anyMatch(assignedRole -> assignedRole.getRole() == role);
    }

    /**
     * Check if user is an admin.
     *
     * @return true if user has ADMIN role
     */
    public boolean isAdmin() {
        return hasRole(Role.ADMIN);
    }

    /**
     * Helper method to convert assigned roles to role set for builder.
     *
     * @return Set of roles extracted from assigned roles
     */
    private Set<Role> extractRoles() {
        return roles.stream()
                .map(AssignedRole::getRole)
                .collect(Collectors.toSet());
    }

    /**
     * Create a copy with a new ID.
     * Used after persistence to return entity with generated ID.
     *
     * @param newId Generated ID from database
     * @return New User instance with ID set
     */
    public User withId(Long newId) {
        return builder()
                .id(newId)
                .username(this.username)
                .email(this.email)
                .passwordHash(this.passwordHash)
                .fullName(this.fullName)
                .isActive(this.isActive)
                .roles(extractRoles())
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .lastLoginAt(this.lastLoginAt)
                .build();
    }

    /**
     * Create a copy with updated full name and email.
     *
     * @param newFullName New full name
     * @param newEmail    New email
     * @return New User instance with updated fields
     */
    public User withUpdatedProfile(String newFullName, String newEmail) {
        return builder()
                .id(this.id)
                .username(this.username)
                .email(newEmail)
                .passwordHash(this.passwordHash)
                .fullName(newFullName)
                .isActive(this.isActive)
                .roles(extractRoles())
                .createdAt(this.createdAt)
                .updatedAt(Instant.now())
                .lastLoginAt(this.lastLoginAt)
                .build();
    }

    /**
     * Create a copy with new roles.
     *
     * @param newRoles New role set
     * @return New User instance with updated roles
     */
    public User withRoles(@Nonnull Set<Role> newRoles) {
        return builder()
                .id(this.id)
                .username(this.username)
                .email(this.email)
                .passwordHash(this.passwordHash)
                .fullName(this.fullName)
                .isActive(this.isActive)
                .roles(newRoles)
                .createdAt(this.createdAt)
                .updatedAt(Instant.now())
                .lastLoginAt(this.lastLoginAt)
                .build();
    }

    /**
     * Create a copy with new password hash.
     *
     * @param newPasswordHash New encoded password
     * @return New User instance with updated password
     */
    public User withPasswordHash(String newPasswordHash) {
        return builder()
                .id(this.id)
                .username(this.username)
                .email(this.email)
                .passwordHash(newPasswordHash)
                .fullName(this.fullName)
                .isActive(this.isActive)
                .roles(extractRoles())
                .createdAt(this.createdAt)
                .updatedAt(Instant.now())
                .lastLoginAt(this.lastLoginAt)
                .build();
    }

    /**
     * Create a deactivated copy.
     *
     * @return New User instance with isActive = false
     */
    public User deactivate() {
        return builder()
                .id(this.id)
                .username(this.username)
                .email(this.email)
                .passwordHash(this.passwordHash)
                .fullName(this.fullName)
                .isActive(false)
                .roles(extractRoles())
                .createdAt(this.createdAt)
                .updatedAt(Instant.now())
                .lastLoginAt(this.lastLoginAt)
                .build();
    }

    /**
     * Create an activated copy.
     *
     * @return New User instance with isActive = true
     */
    public User activate() {
        return builder()
                .id(this.id)
                .username(this.username)
                .email(this.email)
                .passwordHash(this.passwordHash)
                .fullName(this.fullName)
                .isActive(true)
                .roles(extractRoles())
                .createdAt(this.createdAt)
                .updatedAt(Instant.now())
                .lastLoginAt(this.lastLoginAt)
                .build();
    }

    /**
     * Create a copy with updated last login timestamp.
     *
     * @return New User instance with lastLoginAt set to now
     */
    public User withLastLogin() {
        return builder()
                .id(this.id)
                .username(this.username)
                .email(this.email)
                .passwordHash(this.passwordHash)
                .fullName(this.fullName)
                .isActive(this.isActive)
                .roles(extractRoles())
                .createdAt(this.createdAt)
                .updatedAt(Instant.now())
                .lastLoginAt(Instant.now())
                .build();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id) &&
                Objects.equals(username, user.username);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, username);
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", fullName='" + fullName + '\'' +
                ", isActive=" + isActive +
                ", roles=" + roles +
                '}';
    }

    public static class Builder {
        private Long id;
        private String username;
        private String email;
        private String passwordHash;
        private String fullName;
        private boolean isActive = true;
        private Set<Role> roles = Collections.emptySet();
        private Instant createdAt;
        private Instant updatedAt;
        private Instant lastLoginAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder passwordHash(String passwordHash) {
            this.passwordHash = passwordHash;
            return this;
        }

        public Builder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public Builder isActive(boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public Builder roles(@Nonnull Set<Role> roles) {
            this.roles = Objects.requireNonNull(roles, "Roles cannot be null");
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

        public Builder lastLoginAt(Instant lastLoginAt) {
            this.lastLoginAt = lastLoginAt;
            return this;
        }

        public User build() {
            return new User(this);
        }
    }
}
