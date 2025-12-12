package com.wellkorea.backend.auth.api.dto;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for user data.
 * Used by UserQuery for read operations (CQRS query side).
 */
public record UserResponse(
        Long id,
        String username,
        String email,
        String fullName,
        boolean isActive,
        List<String> roles,
        Instant createdAt,
        Instant lastLoginAt
) {
}
