package com.wellkorea.backend.shared.storage.api.dto;

/**
 * Response DTO containing presigned upload URL and object key.
 */
public record UploadUrlResponse(
        String uploadUrl,
        String objectKey
) {

    /**
     * Factory method to create a new response.
     *
     * @param uploadUrl  Presigned URL for file upload
     * @param objectKey  Object key (storage path) in MinIO
     * @return New UploadUrlResponse
     */
    public static UploadUrlResponse of(String uploadUrl, String objectKey) {
        return new UploadUrlResponse(uploadUrl, objectKey);
    }
}
