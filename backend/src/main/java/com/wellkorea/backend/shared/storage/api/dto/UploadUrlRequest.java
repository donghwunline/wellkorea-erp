package com.wellkorea.backend.shared.storage.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for generating a presigned upload URL.
 */
public record UploadUrlRequest(
        @NotBlank(message = "File name is required")
        String fileName,

        @Positive(message = "File size must be positive")
        Long fileSize,

        @NotBlank(message = "Content type is required")
        String contentType
) {
}
