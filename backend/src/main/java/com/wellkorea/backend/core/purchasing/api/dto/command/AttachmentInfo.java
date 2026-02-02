package com.wellkorea.backend.core.purchasing.api.dto.command;

import com.wellkorea.backend.core.production.domain.AllowedFileType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Nested DTO for attachment info within create request.
 * References an existing file in MinIO (from TaskFlow blueprints).
 */
public record AttachmentInfo(
        @NotBlank String fileName,
        @NotNull AllowedFileType fileType,
        @NotNull @Positive Long fileSize,
        @NotBlank String storagePath
) {
}
