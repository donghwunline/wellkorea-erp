package com.wellkorea.backend.approval.api.dto.command;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for rejecting at a level.
 */
public record RejectRequest(
        @NotBlank(message = "Rejection reason is mandatory")
        String reason,

        String comments
) {
}
