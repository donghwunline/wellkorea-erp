package com.wellkorea.backend.auth.application;

import com.wellkorea.backend.auth.api.dto.LoginResponse;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service for authentication operations.
 * Handles login, logout, token refresh, and current user retrieval.
 * <p>
 * Uses UserRepository directly for authentication (not UserQuery/UserCommand)
 * since authentication has its own concerns separate from user management.
 */
@Service
@Transactional(readOnly = true)
public class AuthenticationService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    // Simple in-memory token blacklist for logout
    // In production, use Redis or database-backed blacklist
    private final Set<String> tokenBlacklist = ConcurrentHashMap.newKeySet();

    public AuthenticationService(
            UserRepository userRepository,
            JwtTokenProvider jwtTokenProvider,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Authenticate user and generate JWT token.
     *
     * @param username User's login username
     * @param password User's plain-text password
     * @return LoginResponse with token and user info
     * @throws AuthenticationException if credentials are invalid
     */
    public LoginResponse login(String username, String password) {
        validateNotBlank(username, "Username is required");
        validateNotBlank(password, "Password is required");

        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            throw new AuthenticationException("Invalid credentials");
        }

        User user = userOpt.get();

        if (!user.isActive()) {
            throw new AuthenticationException("Invalid credentials");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new AuthenticationException("Invalid credentials");
        }

        // Load user roles from database
        User userWithRoles = loadUserRoles(user);

        String roles = userWithRoles.getRolesAsString();
        String token = jwtTokenProvider.generateToken(username, roles);

        // Update last login (fire-and-forget, don't block login)
        updateLastLogin(userWithRoles);

        return LoginResponse.bearer(
                token,
                3600L, // TODO: Get from configuration
                toUserInfo(userWithRoles)
        );
    }

    /**
     * Logout user by invalidating their token.
     *
     * @param token JWT token to invalidate
     * @throws AuthenticationException if token is invalid
     */
    public void logout(String token) {
        validateNotBlank(token, "Token is required");

        if (!jwtTokenProvider.validateToken(token)) {
            throw new AuthenticationException("Invalid token");
        }

        // Add to blacklist (token will be rejected on future requests)
        tokenBlacklist.add(token);
    }

    /**
     * Refresh an existing token.
     * Generates a new token for an active user.
     *
     * @param token Current valid JWT token
     * @return New LoginResponse with refreshed token
     * @throws AuthenticationException if token is invalid or user is not active
     */
    public LoginResponse refreshToken(String token) {
        validateNotBlank(token, "Token is required");

        if (!jwtTokenProvider.validateToken(token)) {
            throw new AuthenticationException("Invalid or expired token");
        }

        if (isTokenBlacklisted(token)) {
            throw new AuthenticationException("Token has been invalidated");
        }

        String username = jwtTokenProvider.getUsername(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        if (!user.isActive()) {
            throw new AuthenticationException("User is not active");
        }

        // Load roles and generate new token
        User userWithRoles = loadUserRoles(user);
        String roles = userWithRoles.getRolesAsString();
        String newToken = jwtTokenProvider.generateToken(username, roles);

        // Blacklist old token
        tokenBlacklist.add(token);

        return LoginResponse.bearer(
                newToken,
                3600L,
                toUserInfo(userWithRoles)
        );
    }

    /**
     * Get current user info from token.
     *
     * @param token Valid JWT token
     * @return UserInfo for the authenticated user
     * @throws AuthenticationException if token is invalid or user not found
     */
    public LoginResponse.UserInfo getCurrentUser(String token) {
        validateNotBlank(token, "Token is required");

        if (!jwtTokenProvider.validateToken(token)) {
            throw new AuthenticationException("Invalid token");
        }

        if (isTokenBlacklisted(token)) {
            throw new AuthenticationException("Token has been invalidated");
        }

        String username = jwtTokenProvider.getUsername(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        User userWithRoles = loadUserRoles(user);
        return toUserInfo(userWithRoles);
    }

    /**
     * Check if a token has been blacklisted (logged out).
     *
     * @param token JWT token to check
     * @return true if token is blacklisted
     */
    public boolean isTokenBlacklisted(String token) {
        return tokenBlacklist.contains(token);
    }

    // ==================== Helper Methods ====================

    /**
     * Load roles for a user from the database.
     * Since roles are stored in a junction table and marked as @Transient in the entity,
     * we need to load them separately.
     *
     * @param user User entity (without roles)
     * @return User with roles populated
     */
    private User loadUserRoles(User user) {
        List<String> roleNames = userRepository.findRoleNamesByUserId(user.getId());
        Set<Role> roles = roleNames.stream()
                .map(Role::fromName)
                .collect(Collectors.toSet());
        return user.withRoles(roles);
    }

    private void validateNotBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    @Transactional
    protected void updateLastLogin(User user) {
        try {
            User updated = user.withLastLogin();
            userRepository.save(updated);
        } catch (Exception e) {
            // Log but don't fail login
            // In production, use proper logging
        }
    }

    private LoginResponse.UserInfo toUserInfo(User user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getAuthority)
                .toList();

        return new LoginResponse.UserInfo(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                roles
        );
    }
}
