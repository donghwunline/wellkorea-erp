package com.wellkorea.backend.shared.storage.api.dto;

import com.wellkorea.backend.shared.storage.domain.Attachment;

import java.time.Instant;

/**
 * View DTO for attachment data.
 * Used in responses to display attachment information.
 */
public record AttachmentView(
        Long id,
        String ownerType,
        Long ownerId,
        String fileName,
        String fileType,
        Long fileSize,
        String formattedFileSize,
        String uploadedByName,
        Instant uploadedAt,
        String downloadUrl
) {

    /**
     * Create an AttachmentView from an Attachment entity.
     *
     * @param attachment  Attachment entity
     * @param downloadUrl Generated download URL
     * @return AttachmentView
     */
    public static AttachmentView fromEntity(Attachment attachment, String downloadUrl) {
        return new AttachmentView(
                attachment.getId(),
                attachment.getOwnerType().name(),
                attachment.getOwnerId(),
                attachment.getFileName(),
                attachment.getFileType().name(),
                attachment.getFileSize(),
                attachment.getFormattedFileSize(),
                attachment.getUploadedBy().getFullName(),
                attachment.getUploadedAt(),
                downloadUrl
        );
    }
}
