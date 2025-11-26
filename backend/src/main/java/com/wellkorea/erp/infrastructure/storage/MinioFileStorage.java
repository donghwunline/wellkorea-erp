package com.wellkorea.erp.infrastructure.storage;

import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * MinIO S3-compatible file storage service
 */
@Service
public class MinioFileStorage {

    private static final Logger logger = LoggerFactory.getLogger(MinioFileStorage.class);

    private final MinioClient minioClient;
    private final String bucketName;

    public MinioFileStorage(
            @Value("${minio.url}") String minioUrl,
            @Value("${minio.access-key}") String accessKey,
            @Value("${minio.secret-key}") String secretKey,
            @Value("${minio.bucket-name}") String bucketName) {
        this.minioClient = MinioClient.builder()
                .endpoint(minioUrl)
                .credentials(accessKey, secretKey)
                .build();
        this.bucketName = bucketName;
    }

    /**
     * Upload file to MinIO
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        try {
            // Generate unique file path
            String fileName = generateFileName(file.getOriginalFilename());
            String objectName = folder + "/" + fileName;

            // Upload file
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            logger.info("File uploaded successfully: {}", objectName);
            return objectName;

        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException e) {
            logger.error("Error uploading file to MinIO", e);
            throw new IOException("Failed to upload file", e);
        }
    }

    /**
     * Download file from MinIO
     */
    public InputStream downloadFile(String objectName) throws IOException {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException e) {
            logger.error("Error downloading file from MinIO", e);
            throw new IOException("Failed to download file", e);
        }
    }

    /**
     * Delete file from MinIO
     */
    public void deleteFile(String objectName) throws IOException {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            logger.info("File deleted successfully: {}", objectName);
        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException e) {
            logger.error("Error deleting file from MinIO", e);
            throw new IOException("Failed to delete file", e);
        }
    }

    /**
     * Get presigned URL for temporary file access
     */
    public String getPresignedUrl(String objectName, int expiryMinutes) throws IOException {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(expiryMinutes, TimeUnit.MINUTES)
                            .build()
            );
        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException e) {
            logger.error("Error generating presigned URL", e);
            throw new IOException("Failed to generate presigned URL", e);
        }
    }

    /**
     * Check if file exists
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
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get file metadata
     */
    public StatObjectResponse getFileMetadata(String objectName) throws IOException {
        try {
            return minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (MinioException | InvalidKeyException | NoSuchAlgorithmException e) {
            logger.error("Error getting file metadata", e);
            throw new IOException("Failed to get file metadata", e);
        }
    }

    /**
     * Generate unique file name
     */
    private String generateFileName(String originalFilename) {
        String uuid = UUID.randomUUID().toString();
        if (originalFilename != null && originalFilename.contains(".")) {
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            return uuid + extension;
        }
        return uuid;
    }
}
