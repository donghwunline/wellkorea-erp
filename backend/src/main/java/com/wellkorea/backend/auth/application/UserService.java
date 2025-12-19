package com.wellkorea.backend.auth.application;

import com.wellkorea.backend.auth.api.dto.UserResponse;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;

/**
 * Service implementing both UserQuery and UserCommand interfaces.
 * <p>
 * CQRS pattern:
 * - Command methods work with User entities, return void or ID
 * - Query methods return UserResponse DTOs directly
 */
@Service
@Transactional(readOnly = true)
public class UserService implements UserQuery, UserCommand {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ==================== Query Operations (return DTOs) ====================

    @Override
    public Optional<UserResponse> getUserById(Long id) {
        return userRepository.findById(id).map(this::toResponse);
    }

    @Override
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public Page<UserResponse> getActiveUsers(Pageable pageable) {
        return userRepository.findByIsActiveTrue(pageable).map(this::toResponse);
    }

    @Override
    public Page<UserResponse> searchUsers(String searchTerm, Pageable pageable) {
        return userRepository.searchByUsernameOrEmail(searchTerm, pageable).map(this::toResponse);
    }

    // ==================== Command Operations (work with entities) ====================

    @Override
    @Transactional
    public Long createUser(String username, String email, String password, String fullName, Set<Role> roles) {
        // Validate required fields
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists: " + username);
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists: " + email);
        }

        String passwordHash = passwordEncoder.encode(password);

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordHash)
                .fullName(fullName)
                .isActive(true)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);
        return savedUser.getId();
    }

    @Override
    @Transactional
    public void updateUser(Long userId, String fullName, String email) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (userRepository.existsByEmailAndIdNot(email, userId)) {
            throw new IllegalArgumentException("Email already exists: " + email);
        }

        User updatedUser = user.withUpdatedProfile(fullName, email);
        userRepository.save(updatedUser);
    }

    @Override
    @Transactional
    public void assignRoles(Long userId, Set<Role> roles) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        User updatedUser = user.withRoles(roles);
        userRepository.save(updatedUser);
    }

    @Override
    @Transactional
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        User deactivatedUser = user.deactivate();
        userRepository.save(deactivatedUser);
    }

    @Override
    @Transactional
    public void activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        User activatedUser = user.activate();
        userRepository.save(activatedUser);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        String newPasswordHash = passwordEncoder.encode(newPassword);
        User updatedUser = user.withPasswordHash(newPasswordHash);
        userRepository.save(updatedUser);
    }

    // ==================== Additional Query Methods ====================

    /**
     * Find a user by username (returns domain entity).
     * Used for internal operations like authentication and project creation.
     *
     * @param username Username to search for
     * @return Optional containing the User entity if found
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // ==================== Helper Methods ====================

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.isActive(),
                user.getRoles().stream().map(Role::getAuthority).toList(),
                user.getCreatedAt(),
                user.getLastLoginAt()
        );
    }
}
