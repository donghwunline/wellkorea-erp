package com.wellkorea.erp.infrastructure.storage;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Initialize MinIO bucket on application startup
 */
@Component
public class MinioInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(MinioInitializer.class);

    private final MinioClient minioClient;
    private final String bucketName;

    public MinioInitializer(
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

    @Override
    public void run(String... args) throws Exception {
        try {
            // Check if bucket exists
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build()
            );

            if (!exists) {
                // Create bucket
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(bucketName)
                                .build()
                );
                logger.info("MinIO bucket created successfully: {}", bucketName);
            } else {
                logger.info("MinIO bucket already exists: {}", bucketName);
            }
        } catch (Exception e) {
            logger.error("Error initializing MinIO bucket", e);
            // Don't fail application startup
        }
    }
}
