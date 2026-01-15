package com.wellkorea.backend.production.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Request to generate a presigned upload URL for direct MinIO upload.
 */
public record UploadUrlRequest(
        @NotBlank(message = "File name is required")
        String fileName,

        @Positive(message = "File size must be positive")
        Long fileSize,

        @NotBlank(message = "Content type is required")
        String contentType
) {}
