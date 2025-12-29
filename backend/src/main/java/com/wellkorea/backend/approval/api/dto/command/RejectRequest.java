package com.wellkorea.backend.approval.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for rejecting at a level.
 */
public record RejectRequest(
        @NotBlank(message = "Rejection reason is mandatory")
        @Size(max = 500, message = "Rejection reason must be at most 500 characters")
        String reason,

        @Size(max = 2000, message = "Comments must be at most 2000 characters")
        String comments
) {
}
