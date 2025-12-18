package com.wellkorea.backend.auth.api.dto;

import java.util.List;

/**
 * Response body for successful /api/auth/login.
 * Contains JWT tokens and user information.
 *
 * @param accessToken  JWT access token
 * @param refreshToken JWT refresh token (null until refresh token feature is implemented)
 * @param user         Authenticated user information
 */
public record LoginResponse(
        String accessToken,
        String refreshToken,
        UserInfo user
) {
    /**
     * Creates a LoginResponse with access token and user info.
     * Refresh token is set to null (to be implemented later).
     *
     * @param accessToken JWT access token
     * @param user        Authenticated user information
     * @return LoginResponse with null refresh token
     */
    public static LoginResponse of(String accessToken, UserInfo user) {
        return new LoginResponse(accessToken, null, user);
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
