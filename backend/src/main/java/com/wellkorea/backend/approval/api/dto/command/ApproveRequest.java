package com.wellkorea.backend.approval.api.dto.command;

/**
 * Request DTO for approving at a level.
 */
public record ApproveRequest(
        String comments
) {}
