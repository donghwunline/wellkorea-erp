package com.wellkorea.backend.production.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Request to register an attachment after successful direct upload to MinIO.
 */
public record RegisterAttachmentRequest(
        @NotBlank(message = "File name is required")
        String fileName,

        @Positive(message = "File size must be positive")
        Long fileSize,

        @NotBlank(message = "Object key is required")
        String objectKey
) {}
