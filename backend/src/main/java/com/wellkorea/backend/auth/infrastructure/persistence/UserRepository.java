package com.wellkorea.backend.auth.infrastructure.persistence;

import com.wellkorea.backend.auth.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for User entity persistence.
 * Provides query methods for user authentication and management.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by username (without roles).
     *
     * @param username Login username
     * @return User if found
     */
    Optional<User> findByUsername(String username);

    /**
     * Get role names for a user.
     * Used to populate the transient roles field after loading a user.
     *
     * @param userId User ID
     * @return List of role names (e.g., ["ADMIN", "FINANCE"])
     */
    @Query(value = """
            SELECT r.name
            FROM roles r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = :userId
            """, nativeQuery = true)
    List<String> findRoleNamesByUserId(@Param("userId") Long userId);

    /**
     * Find user by email.
     *
     * @param email Email address
     * @return User if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if username exists.
     *
     * @param username Username to check
     * @return true if exists
     */
    boolean existsByUsername(String username);

    /**
     * Check if email exists.
     *
     * @param email Email to check
     * @return true if exists
     */
    boolean existsByEmail(String email);

    /**
     * Check if email exists for a different user.
     * Used during update to allow keeping same email.
     *
     * @param email Email to check
     * @param id    User ID to exclude
     * @return true if email exists for another user
     */
    boolean existsByEmailAndIdNot(String email, Long id);

    /**
     * Find all active users.
     *
     * @return List of active users
     */
    List<User> findByIsActiveTrue();

    /**
     * Find active users with pagination.
     *
     * @param pageable Pagination parameters
     * @return Page of active users
     */
    Page<User> findByIsActiveTrue(Pageable pageable);

    /**
     * Search users by username or email pattern.
     *
     * @param searchTerm Search term (partial match)
     * @param pageable   Pagination parameters
     * @return Page of matching users
     */
    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
            """)
    Page<User> searchByUsernameOrEmail(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Find all users by role.
     * Uses native query to join with user_roles table.
     *
     * @param roleName Role name (e.g., "ADMIN", "FINANCE")
     * @return List of users with the specified role
     */
    @Query(value = """
            SELECT u.* FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = :roleName AND u.is_active = true
            """, nativeQuery = true)
    List<User> findByRoleName(@Param("roleName") String roleName);
}
