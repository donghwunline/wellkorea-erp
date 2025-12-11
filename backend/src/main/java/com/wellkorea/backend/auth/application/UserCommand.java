package com.wellkorea.backend.auth.application;

import com.wellkorea.backend.auth.domain.Role;

import java.util.Set;

/**
 * Command interface for User write operations.
 * Following CQRS pattern - uses JPA entities internally.
 * <p>
 * Command operations modify state and are transactional.
 * Returns the ID of affected entity for subsequent queries via UserQuery.
 */
public interface UserCommand {

    /**
     * Create a new user with encoded password.
     *
     * @param username User's login username (must be unique)
     * @param email    User's email address (must be unique)
     * @param password User's plain-text password (will be encoded)
     * @param fullName User's display name
     * @param roles    Set of roles to assign
     * @return ID of created user
     * @throws IllegalArgumentException if username or email already exists
     */
    Long createUser(String username, String email, String password, String fullName, Set<Role> roles);

    /**
     * Update user's profile information.
     *
     * @param userId   User's database ID
     * @param fullName New display name
     * @param email    New email address (must be unique)
     * @throws IllegalArgumentException if user not found or email already exists
     */
    void updateUser(Long userId, String fullName, String email);

    /**
     * Assign roles to a user (replaces existing roles).
     *
     * @param userId User's database ID
     * @param roles  Set of roles to assign
     * @throws IllegalArgumentException if user not found
     */
    void assignRoles(Long userId, Set<Role> roles);

    /**
     * Deactivate a user (soft delete).
     * User will not be able to log in after deactivation.
     *
     * @param userId User's database ID
     * @throws IllegalArgumentException if user not found
     */
    void deactivateUser(Long userId);

    /**
     * Activate a previously deactivated user.
     *
     * @param userId User's database ID
     * @throws IllegalArgumentException if user not found
     */
    void activateUser(Long userId);

    /**
     * Change user's password.
     *
     * @param userId      User's database ID
     * @param newPassword New plain-text password (will be encoded)
     * @throws IllegalArgumentException if user not found
     */
    void changePassword(Long userId, String newPassword);
}
