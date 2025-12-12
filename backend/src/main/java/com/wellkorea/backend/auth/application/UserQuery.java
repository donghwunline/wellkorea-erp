package com.wellkorea.backend.auth.application;

import com.wellkorea.backend.auth.api.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

/**
 * Query interface for User read operations.
 * Following CQRS pattern - returns DTOs directly for read optimization.
 * <p>
 * Query operations are side-effect free and can be cached.
 * Uses DTO projections to avoid loading full entity graphs.
 */
public interface UserQuery {

    /**
     * Get user by ID for display.
     *
     * @param id User's database ID
     * @return UserResponse DTO if found
     */
    Optional<UserResponse> getUserById(Long id);

    /**
     * Get all users with pagination for admin listing.
     *
     * @param pageable Pagination parameters
     * @return Page of UserResponse DTOs
     */
    Page<UserResponse> getAllUsers(Pageable pageable);

    /**
     * Get all active users with pagination.
     *
     * @param pageable Pagination parameters
     * @return Page of active UserResponse DTOs
     */
    Page<UserResponse> getActiveUsers(Pageable pageable);

    /**
     * Search users by username or email pattern.
     *
     * @param searchTerm Search term (partial match)
     * @param pageable   Pagination parameters
     * @return Page of matching UserResponse DTOs
     */
    Page<UserResponse> searchUsers(String searchTerm, Pageable pageable);
}
