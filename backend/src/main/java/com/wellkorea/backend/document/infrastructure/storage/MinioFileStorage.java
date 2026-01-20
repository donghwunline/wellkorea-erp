package com.wellkorea.backend.document.infrastructure.storage;

import com.wellkorea.backend.shared.exception.BusinessException;
import io.minio.*;
import io.minio.errors.ErrorResponseException;
import io.minio.http.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

/**
 * MinIO-based file storage service for document management.
 * Handles upload, download, deletion, and presigned URL generation for:
 * - Quotation PDFs
 * - Tax Invoice PDFs
 * - Delivery documents
 * - Excel exports
 * - User-uploaded attachments
 * <p>
 * Thread-safe and supports all major file operations required by the ERP system.
 */
@Service
public class MinioFileStorage {

    private static final Logger log = LoggerFactory.getLogger(MinioFileStorage.class);

    private final MinioClient minioClient;
    private final String bucketName;

    public MinioFileStorage(
            @Value("${minio.url}") String minioUrl,
            @Value("${minio.access-key}") String accessKey,
            @Value("${minio.secret-key}") String secretKey,
            @Value("${minio.bucket-name}") String bucketName) {

        // Single client for all MinIO operations
        // In Docker: uses minio.local hostname (resolvable both inside Docker and from browser via /etc/hosts)
        // In local dev: uses localhost
        this.minioClient = MinioClient.builder()
                .endpoint(minioUrl)
                .credentials(accessKey, secretKey)
                .build();

        this.bucketName = bucketName;

        ensureBucketExists();
    }

    /**
     * Ensure the configured bucket exists, create if not.
     * Called during service initialization.
     */
    private void ensureBucketExists() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build()
            );

            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(bucketName).build()
                );
                log.info("Created MinIO bucket: {}", bucketName);
            } else {
                log.debug("MinIO bucket already exists: {}", bucketName);
            }
        } catch (Exception e) {
            log.error("Failed to ensure bucket exists: {}", bucketName, e);
            throw new BusinessException("Failed to initialize file storage: " + e.getMessage());
        }
    }

    /**
     * Upload a file to MinIO.
     *
     * @param objectName  File path/name in MinIO (e.g., "quotations/2025/Q-001.pdf")
     * @param data        File content as byte array
     * @param contentType MIME type (e.g., "application/pdf", "application/vnd.ms-excel")
     * @return Object name (path) of the uploaded file
     */
    public String uploadFile(String objectName, byte[] data, String contentType) {
        try (InputStream inputStream = new ByteArrayInputStream(data)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, data.length, -1)
                            .contentType(contentType)
                            .build()
            );

            log.info("Uploaded file to MinIO: {} (size: {} bytes)", objectName, data.length);
            return objectName;

        } catch (Exception e) {
            log.error("Failed to upload file to MinIO: {}", objectName, e);
            throw new BusinessException("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Upload a file from InputStream (for large files or streaming uploads).
     *
     * @param objectName  File path/name in MinIO
     * @param inputStream File content stream
     * @param size        File size in bytes (-1 if unknown)
     * @param contentType MIME type
     * @return Object name (path) of the uploaded file
     */
    public String uploadFile(String objectName, InputStream inputStream, long size, String contentType) {
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, size, -1)
                            .contentType(contentType)
                            .build()
            );

            log.info("Uploaded file to MinIO: {} (size: {} bytes)", objectName, size);
            return objectName;

        } catch (Exception e) {
            log.error("Failed to upload file to MinIO: {}", objectName, e);
            throw new BusinessException("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Download a file from MinIO.
     *
     * @param objectName File path/name in MinIO
     * @return File content as byte array
     */
    public byte[] downloadFile(String objectName) {
        try (InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
        )) {
            byte[] data = stream.readAllBytes();
            log.debug("Downloaded file from MinIO: {} (size: {} bytes)", objectName, data.length);
            return data;

        } catch (Exception e) {
            log.error("Failed to download file from MinIO: {}", objectName, e);
            throw new BusinessException("Failed to download file: " + e.getMessage());
        }
    }

    /**
     * Download a file as InputStream (for large files or streaming downloads).
     *
     * @param objectName File path/name in MinIO
     * @return InputStream of file content
     */
    public InputStream downloadFileAsStream(String objectName) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to download file stream from MinIO: {}", objectName, e);
            throw new BusinessException("Failed to download file: " + e.getMessage());
        }
    }

    /**
     * Delete a file from MinIO.
     *
     * @param objectName File path/name in MinIO
     */
    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );

            log.info("Deleted file from MinIO: {}", objectName);

        } catch (Exception e) {
            log.error("Failed to delete file from MinIO: {}", objectName, e);
            throw new BusinessException("Failed to delete file: " + e.getMessage());
        }
    }

    /**
     * Check if a file exists in MinIO.
     *
     * @param objectName File path/name in MinIO
     * @return true if file exists, false otherwise
     */
    public boolean fileExists(String objectName) {
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            return true;

        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                return false;
            }
            log.error("Error checking file existence: {}", objectName, e);
            throw new BusinessException("Failed to check file existence: " + e.getMessage());

        } catch (Exception e) {
            log.error("Error checking file existence: {}", objectName, e);
            throw new BusinessException("Failed to check file existence: " + e.getMessage());
        }
    }

    /**
     * Generate a presigned URL for temporary file access (GET).
     * Useful for allowing clients to download files directly without proxying through backend.
     *
     * @param objectName     File path/name in MinIO
     * @param expiryDuration Expiry duration
     * @param expiryUnit     Expiry time unit
     * @return Presigned URL (valid for specified duration)
     */
    public String generatePresignedUrl(String objectName, int expiryDuration, TimeUnit expiryUnit) {
        try {
            int expirySeconds = (int) expiryUnit.toSeconds(expiryDuration);

            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(expirySeconds)
                            .build()
            );

            log.debug("Generated presigned URL for: {} (expires in {} {})", objectName, expiryDuration, expiryUnit);
            return url;

        } catch (Exception e) {
            log.error("Failed to generate presigned URL: {}", objectName, e);
            throw new BusinessException("Failed to generate download URL: " + e.getMessage());
        }
    }

    /**
     * Generate a presigned URL for file upload (PUT).
     * Allows clients to upload files directly to MinIO without proxying through backend.
     *
     * @param objectName     File path/name in MinIO
     * @param expiryDuration Expiry duration
     * @param expiryUnit     Expiry time unit
     * @return Presigned URL for upload (valid for specified duration)
     */
    public String generatePresignedUploadUrl(String objectName, int expiryDuration, TimeUnit expiryUnit) {
        try {
            int expirySeconds = (int) expiryUnit.toSeconds(expiryDuration);

            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.PUT)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(expirySeconds)
                            .build()
            );

            log.debug("Generated presigned upload URL for: {} (expires in {} {})", objectName, expiryDuration, expiryUnit);
            return url;

        } catch (Exception e) {
            log.error("Failed to generate presigned upload URL: {}", objectName, e);
            throw new BusinessException("Failed to generate upload URL: " + e.getMessage());
        }
    }

    /**
     * Get file metadata (size, content type, last modified).
     *
     * @param objectName File path/name in MinIO
     * @return FileMetadata object
     */
    public FileMetadata getFileMetadata(String objectName) {
        try {
            StatObjectResponse stat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );

            return new FileMetadata(
                    objectName,
                    stat.size(),
                    stat.contentType(),
                    stat.lastModified()
            );

        } catch (Exception e) {
            log.error("Failed to get file metadata: {}", objectName, e);
            throw new BusinessException("Failed to get file metadata: " + e.getMessage());
        }
    }

    /**
     * File metadata record.
     */
    public record FileMetadata(
            String objectName,
            long size,
            String contentType,
            java.time.ZonedDateTime lastModified
    ) {
    }
}
