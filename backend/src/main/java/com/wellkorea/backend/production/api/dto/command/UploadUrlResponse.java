package com.wellkorea.backend.production.api.dto.command;

/**
 * Response containing presigned upload URL and object key for direct MinIO upload.
 */
public record UploadUrlResponse(
        String uploadUrl,
        String objectKey
) {}
