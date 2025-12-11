package com.wellkorea.backend.auth.api.dto;

import java.util.List;

/**
 * Response body for successful /api/auth/login.
 * Contains JWT token and user information.
 *
 * @param token     JWT access token
 * @param tokenType Token type (always "Bearer")
 * @param expiresIn Token expiration time in seconds
 * @param user      Authenticated user information
 */
public record LoginResponse(
        String token,
        String tokenType,
        long expiresIn,
        UserInfo user
) {
    /**
     * Creates a LoginResponse with Bearer token type.
     *
     * @param token     JWT access token
     * @param expiresIn Token expiration time in seconds
     * @param user      Authenticated user information
     * @return LoginResponse with Bearer token type
     */
    public static LoginResponse bearer(String token, long expiresIn, UserInfo user) {
        return new LoginResponse(token, "Bearer", expiresIn, user);
    }

    /**
     * User information included in login response.
     *
     * @param id       User's database ID
     * @param username User's login username
     * @param fullName User's display name
     * @param email    User's email address
     * @param roles    User's assigned roles (e.g., ["ROLE_ADMIN", "ROLE_FINANCE"])
     */
    public record UserInfo(
            Long id,
            String username,
            String fullName,
            String email,
            List<String> roles
    ) {
    }
}
