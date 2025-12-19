package com.wellkorea.backend.approval.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for a chain level.
 */
public record ChainLevelRequest(
        @NotNull(message = "Level order is required")
        @Positive(message = "Level order must be positive")
        Integer levelOrder,

        @NotNull(message = "Level name is required")
        String levelName,

        @NotNull(message = "Approver user ID is required")
        Long approverUserId,

        boolean isRequired
) {}
