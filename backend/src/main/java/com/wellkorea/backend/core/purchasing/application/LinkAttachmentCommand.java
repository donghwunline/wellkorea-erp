package com.wellkorea.backend.core.purchasing.application;

import com.wellkorea.backend.core.production.domain.AllowedFileType;

/**
 * Internal command for linking an existing attachment to a ServicePurchaseRequest.
 *
 * @param fileName    Original file name
 * @param fileType    File type (PDF, DXF, DWG, JPG, PNG)
 * @param fileSize    File size in bytes
 * @param storagePath Existing MinIO path from TaskFlow BlueprintAttachment
 */
public record LinkAttachmentCommand(
        String fileName,
        AllowedFileType fileType,
        Long fileSize,
        String storagePath
) {
}
