package com.wellkorea.backend.purchasing.api.dto.query;

/**
 * Response DTO for presigned download URL.
 *
 * @param url Presigned URL for direct file download from MinIO
 */
public record DownloadUrlResponse(String url) {}
