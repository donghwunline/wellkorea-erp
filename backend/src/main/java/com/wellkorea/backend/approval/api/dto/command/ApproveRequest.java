package com.wellkorea.backend.approval.api.dto.command;

import jakarta.validation.constraints.Size;

/**
 * Request DTO for approving at a level.
 */
public record ApproveRequest(
        @Size(max = 2000, message = "Comments must be at most 2000 characters")
        String comments
) {
}
