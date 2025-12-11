package com.wellkorea.backend.auth.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for /api/auth/login endpoint.
 * Contains user credentials for authentication.
 *
 * @param username User's login username (required, non-blank)
 * @param password User's password in plain text (required, non-blank)
 */
public record LoginRequest(
        @NotBlank(message = "Username is required")
        String username,

        @NotBlank(message = "Password is required")
        String password
) {
}
