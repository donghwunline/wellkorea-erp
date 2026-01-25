package com.wellkorea.backend.shared.storage.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for registering an attachment after upload.
 */
public record RegisterAttachmentRequest(
        @NotBlank(message = "File name is required")
        String fileName,

        @Positive(message = "File size must be positive")
        Long fileSize,

        @NotBlank(message = "Object key is required")
        String objectKey
) {
}
