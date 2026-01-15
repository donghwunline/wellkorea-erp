package com.wellkorea.backend.production.api.dto.query;

import com.wellkorea.backend.production.domain.AllowedFileType;

import java.time.Instant;

/**
 * View DTO for blueprint attachment.
 */
public record BlueprintAttachmentView(
        Long id,
        Long taskFlowId,
        String nodeId,
        String fileName,
        AllowedFileType fileType,
        Long fileSize,
        String formattedFileSize,
        String storagePath,
        Long uploadedById,
        String uploadedByName,
        Instant uploadedAt
) {
}
