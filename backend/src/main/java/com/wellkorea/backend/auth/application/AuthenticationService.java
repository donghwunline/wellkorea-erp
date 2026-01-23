package com.wellkorea.backend.auth.application;

import com.wellkorea.backend.auth.api.dto.LoginResponse;
import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.domain.vo.Role;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthenticationService(UserRepository userRepository, JwtTokenProvider jwtTokenProvider, PasswordEncoder passwordEncoder, TokenBlacklistService tokenBlacklistService) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.tokenBlacklistService = tokenBlacklistService;
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

        // Roles are loaded automatically via JPA @ElementCollection (LAZY fetch)
        String roles = user.getRolesAsString();
        String token = jwtTokenProvider.generateToken(username, roles, user.getId());

        // Update last login (fire-and-forget, don't block login)
        updateLastLogin(user);

        return LoginResponse.of(token, toUserInfo(user));
    }

    /**
     * Logout user by invalidating their token.
     *
     * @param token JWT token to invalidate
     * @throws AuthenticationException if token is invalid
     */
    public void logout(String token) {
        validateNotBlank(token, "Token is required");

        try {
            jwtTokenProvider.validateToken(token);
        } catch (com.wellkorea.backend.auth.infrastructure.config.JwtAuthenticationException e) {
            throw new AuthenticationException("Invalid token", e);
        }

        // Add to blacklist (token will be rejected by JwtAuthenticationFilter)
        tokenBlacklistService.blacklistToken(token);
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

        try {
            jwtTokenProvider.validateToken(token);
        } catch (com.wellkorea.backend.auth.infrastructure.config.JwtAuthenticationException e) {
            throw new AuthenticationException("Invalid or expired token", e);
        }

        // Note: Blacklist check is now performed by JwtAuthenticationFilter
        // This method is called from a controller endpoint which requires valid authentication
        // So if we reach here, the token is not blacklisted

        String username = jwtTokenProvider.getUsername(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        if (!user.isActive()) {
            throw new AuthenticationException("User is not active");
        }

        // CRITICAL: Blacklist old token BEFORE generating new token to prevent race condition
        // If we blacklisted after generation, an attacker could make concurrent refresh requests
        // to generate multiple valid tokens from a single compromised token (token amplification attack)
        tokenBlacklistService.blacklistToken(token);

        // Generate new token with current roles
        String roles = user.getRolesAsString();
        String newToken = jwtTokenProvider.generateToken(username, roles, user.getId());

        return LoginResponse.of(newToken, toUserInfo(user));
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

        try {
            jwtTokenProvider.validateToken(token);
        } catch (com.wellkorea.backend.auth.infrastructure.config.JwtAuthenticationException e) {
            throw new AuthenticationException("Invalid token", e);
        }

        // Note: Blacklist check is performed by JwtAuthenticationFilter

        String username = jwtTokenProvider.getUsername(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        return toUserInfo(user);
    }

    // ==================== Helper Methods ====================

    private void validateNotBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    /**
     * Update the last login timestamp for a user.
     * <p>
     * <b>Fire-and-forget pattern:</b> This method intentionally catches and logs exceptions
     * without re-throwing them. The rationale is that updating last login is a non-critical
     * side effect that should never prevent a successful login. If the update fails
     * (e.g., due to a transient database issue), the user should still be able to log in.
     * The failure is logged for operational visibility but does not affect the login response.
     * <p>
     * This approach prioritizes user experience (successful login) over complete data
     * consistency (accurate last_login timestamp).
     *
     * @param user The user whose last login timestamp should be updated
     */
    @Transactional
    protected void updateLastLogin(User user) {
        try {
            User updated = user.withLastLogin();
            userRepository.save(updated);
        } catch (Exception e) {
            // Fire-and-forget: Log error but don't propagate - login should succeed
            // even if we can't record the last login timestamp
            logger.error("Failed to update last login for user: {}", user.getUsername(), e);
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
