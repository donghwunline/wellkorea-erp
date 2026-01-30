package com.wellkorea.backend.purchasing.api.dto.query;

import java.time.Instant;

/**
 * View DTO for attachment references linked to a purchase request.
 *
 * @param referenceId       UUID identifier for this reference
 * @param purchaseRequestId Parent purchase request ID
 * @param fileName          Original file name
 * @param fileType          File type enum name (PDF, DXF, DWG, JPG, PNG)
 * @param fileSize          File size in bytes
 * @param formattedFileSize Human-readable file size (e.g., "2.5 MB")
 * @param storagePath       MinIO storage path
 * @param linkedById        User ID who linked this attachment
 * @param linkedAt          Timestamp when linked
 */
public record AttachmentReferenceView(
        String referenceId,
        Long purchaseRequestId,
        String fileName,
        String fileType,
        Long fileSize,
        String formattedFileSize,
        String storagePath,
        Long linkedById,
        Instant linkedAt
) {}
