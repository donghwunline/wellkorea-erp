package com.wellkorea.backend.document.infrastructure.storage;

import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.shared.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for MinioFileStorage.
 * Tests file upload, download, deletion, existence checks, presigned URLs, and metadata retrieval.
 */
class MinioFileStorageTest extends BaseIntegrationTest {

    @Autowired
    private MinioFileStorage minioFileStorage;

    private static final String TEST_FILE_NAME = "test-documents/test-file.txt";
    private static final String TEST_CONTENT = "Test file content for MinIO integration tests";
    private static final byte[] TEST_DATA = TEST_CONTENT.getBytes(StandardCharsets.UTF_8);
    private static final String TEST_CONTENT_TYPE = "text/plain";

    @BeforeEach
    void setUp() {
        // Clean up test file if it exists from previous test
        try {
            if (minioFileStorage.fileExists(TEST_FILE_NAME)) {
                minioFileStorage.deleteFile(TEST_FILE_NAME);
            }
        } catch (Exception e) {
            // Ignore cleanup errors
        }
    }

    // ========== Upload Tests (Byte Array) ==========

    @Test
    void shouldUploadFileWithByteArray() {
        // Given: File data, name, and content type

        // When: Upload file
        String result = minioFileStorage.uploadFile(TEST_FILE_NAME, TEST_DATA, TEST_CONTENT_TYPE);

        // Then: Upload successful, file exists
        assertThat(result).isEqualTo(TEST_FILE_NAME);
        assertThat(minioFileStorage.fileExists(TEST_FILE_NAME)).isTrue();
    }

    @Test
    void shouldUploadPdfFile() {
        // Given: PDF file simulation
        String pdfFileName = "quotations/2025/Q-001.pdf";
        byte[] pdfData = "Mock PDF content".getBytes(StandardCharsets.UTF_8);
        String pdfContentType = "application/pdf";

        // When: Upload PDF
        String result = minioFileStorage.uploadFile(pdfFileName, pdfData, pdfContentType);

        // Then: Upload successful
        assertThat(result).isEqualTo(pdfFileName);
        assertThat(minioFileStorage.fileExists(pdfFileName)).isTrue();

        // Cleanup
        minioFileStorage.deleteFile(pdfFileName);
    }

    @Test
    void shouldUploadExcelFile() {
        // Given: Excel file simulation
        String excelFileName = "exports/2025/inventory.xlsx";
        byte[] excelData = "Mock Excel content".getBytes(StandardCharsets.UTF_8);
        String excelContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        // When: Upload Excel
        String result = minioFileStorage.uploadFile(excelFileName, excelData, excelContentType);

        // Then: Upload successful
        assertThat(result).isEqualTo(excelFileName);
        assertThat(minioFileStorage.fileExists(excelFileName)).isTrue();

        // Cleanup
        minioFileStorage.deleteFile(excelFileName);
    }

    // ========== Upload Tests (InputStream) ==========

    @Test
    void shouldUploadFileWithInputStream() {
        // Given: File data as InputStream
        InputStream inputStream = new ByteArrayInputStream(TEST_DATA);

        // When: Upload file via InputStream
        String result = minioFileStorage.uploadFile(
                TEST_FILE_NAME,
                inputStream,
                TEST_DATA.length,
                TEST_CONTENT_TYPE
        );

        // Then: Upload successful
        assertThat(result).isEqualTo(TEST_FILE_NAME);
        assertThat(minioFileStorage.fileExists(TEST_FILE_NAME)).isTrue();
    }

    @Test
    void shouldUploadLargeFileWithInputStream() {
        // Given: Large file simulation (10KB)
        byte[] largeData = new byte[10240]; // 10KB
        for (int i = 0; i < largeData.length; i++) {
            largeData[i] = (byte) (i % 256);
        }
        InputStream inputStream = new ByteArrayInputStream(largeData);
        String largeFileName = "large-files/test-large.bin";

        // When: Upload large file
        String result = minioFileStorage.uploadFile(
                largeFileName,
                inputStream,
                largeData.length,
                "application/octet-stream"
        );

        // Then: Upload successful
        assertThat(result).isEqualTo(largeFileName);
        assertThat(minioFileStorage.fileExists(largeFileName)).isTrue();

        // Cleanup
        minioFileStorage.deleteFile(largeFileName);
    }

    // ========== Download Tests ==========

    @Test
    void shouldDownloadFileAsByteArray() {
        // Given: File uploaded to MinIO
        minioFileStorage.uploadFile(TEST_FILE_NAME, TEST_DATA, TEST_CONTENT_TYPE);

        // When: Download file
        byte[] downloadedData = minioFileStorage.downloadFile(TEST_FILE_NAME);

        // Then: Downloaded content matches uploaded content
        assertThat(downloadedData).isEqualTo(TEST_DATA);
        assertThat(new String(downloadedData, StandardCharsets.UTF_8)).isEqualTo(TEST_CONTENT);
    }

    @Test
    void shouldDownloadFileAsInputStream() throws Exception {
        // Given: File uploaded to MinIO
        minioFileStorage.uploadFile(TEST_FILE_NAME, TEST_DATA, TEST_CONTENT_TYPE);

        // When: Download file as InputStream
        try (InputStream stream = minioFileStorage.downloadFileAsStream(TEST_FILE_NAME)) {
            byte[] downloadedData = stream.readAllBytes();

            // Then: Downloaded content matches uploaded content
            assertThat(downloadedData).isEqualTo(TEST_DATA);
            assertThat(new String(downloadedData, StandardCharsets.UTF_8)).isEqualTo(TEST_CONTENT);
        }
    }

    @Test
    void shouldThrowExceptionWhenDownloadingNonExistentFile() {
        // Given: Non-existent file name
        String nonExistentFile = "non-existent/file.txt";

        // When/Then: Download throws BusinessException
        assertThatThrownBy(() -> minioFileStorage.downloadFile(nonExistentFile))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Failed to download file");
    }

    // ========== Delete Tests ==========

    @Test
    void shouldDeleteFile() {
        // Given: File uploaded to MinIO
        minioFileStorage.uploadFile(TEST_FILE_NAME, TEST_DATA, TEST_CONTENT_TYPE);
        assertThat(minioFileStorage.fileExists(TEST_FILE_NAME)).isTrue();

        // When: Delete file
        minioFileStorage.deleteFile(TEST_FILE_NAME);

        // Then: File no longer exists
        assertThat(minioFileStorage.fileExists(TEST_FILE_NAME)).isFalse();
    }

    @Test
    void shouldNotThrowExceptionWhenDeletingNonExistentFile() {
        // Given: Non-existent file name
        String nonExistentFile = "non-existent/file.txt";

        // When/Then: Delete does not throw exception (idempotent)
        assertThatCode(() -> minioFileStorage.deleteFile(nonExistentFile))
                .doesNotThrowAnyException();
    }

    // ========== File Existence Tests ==========

    @Test
    void shouldReturnTrueWhenFileExists() {
        // Given: File uploaded to MinIO
        minioFileStorage.uploadFile(TEST_FILE_NAME, TEST_DATA, TEST_CONTENT_TYPE);

        // When: Check file existence
        boolean exists = minioFileStorage.fileExists(TEST_FILE_NAME);

        // Then: File exists
        assertThat(exists).isTrue();
    }

    @Test
    void shouldReturnFalseWhenFileDoesNotExist() {
        // Given: Non-existent file name
        String nonExistentFile = "non-existent/file.txt";

        // When: Check file existence
        boolean exists = minioFileStorage.fileExists(nonExistentFile);

        // Then: File does not exist
        assertThat(exists).isFalse();
    }

    // ========== Presigned URL Tests ==========

    @Test
    void shouldGeneratePresignedDownloadUrl() {
        // Given: File uploaded to MinIO
        minioFileStorage.uploadFile(TEST_FILE_NAME, TEST_DATA, TEST_CONTENT_TYPE);

        // When: Generate presigned URL
        String presignedUrl = minioFileStorage.generatePresignedUrl(TEST_FILE_NAME, 1, TimeUnit.HOURS);

        // Then: URL is generated (contains necessary parameters)
        assertThat(presignedUrl).isNotBlank();
        assertThat(presignedUrl).contains(TEST_FILE_NAME);
        assertThat(presignedUrl).contains("X-Amz-Signature"); // S3-compatible signature
    }

    @Test
    void shouldGeneratePresignedUploadUrl() {
        // Given: File name for upload
        String uploadFileName = "uploads/new-file.txt";

        // When: Generate presigned upload URL
        String presignedUrl = minioFileStorage.generatePresignedUploadUrl(uploadFileName, 15, TimeUnit.MINUTES);

        // Then: URL is generated (contains necessary parameters)
        assertThat(presignedUrl).isNotBlank();
        assertThat(presignedUrl).contains(uploadFileName);
        assertThat(presignedUrl).contains("X-Amz-Signature");
    }

    @Test
    void shouldGeneratePresignedUrlWithDifferentExpiry() {
        // Given: File uploaded to MinIO
        minioFileStorage.uploadFile(TEST_FILE_NAME, TEST_DATA, TEST_CONTENT_TYPE);

        // When: Generate presigned URLs with different expiry times
        String url1Hour = minioFileStorage.generatePresignedUrl(TEST_FILE_NAME, 1, TimeUnit.HOURS);
        String url24Hours = minioFileStorage.generatePresignedUrl(TEST_FILE_NAME, 24, TimeUnit.HOURS);

        // Then: Both URLs generated (expiry encoded in signature, so URLs will differ)
        assertThat(url1Hour).isNotBlank();
        assertThat(url24Hours).isNotBlank();
        assertThat(url1Hour).isNotEqualTo(url24Hours); // Different expiry = different signature
    }

    // ========== File Metadata Tests ==========

    @Test
    void shouldGetFileMetadata() {
        // Given: File uploaded to MinIO
        minioFileStorage.uploadFile(TEST_FILE_NAME, TEST_DATA, TEST_CONTENT_TYPE);

        // When: Get file metadata
        MinioFileStorage.FileMetadata metadata = minioFileStorage.getFileMetadata(TEST_FILE_NAME);

        // Then: Metadata contains correct information
        assertThat(metadata).isNotNull();
        assertThat(metadata.objectName()).isEqualTo(TEST_FILE_NAME);
        assertThat(metadata.size()).isEqualTo(TEST_DATA.length);
        assertThat(metadata.contentType()).isEqualTo(TEST_CONTENT_TYPE);
        assertThat(metadata.lastModified()).isNotNull();
    }

    @Test
    void shouldThrowExceptionWhenGettingMetadataForNonExistentFile() {
        // Given: Non-existent file name
        String nonExistentFile = "non-existent/file.txt";

        // When/Then: Get metadata throws BusinessException
        assertThatThrownBy(() -> minioFileStorage.getFileMetadata(nonExistentFile))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Failed to get file metadata");
    }

    // ========== Overwrite Tests ==========

    @Test
    void shouldOverwriteExistingFile() {
        // Given: File already uploaded
        minioFileStorage.uploadFile(TEST_FILE_NAME, TEST_DATA, TEST_CONTENT_TYPE);

        // When: Upload same file name with different content
        String newContent = "Updated content";
        byte[] newData = newContent.getBytes(StandardCharsets.UTF_8);
        minioFileStorage.uploadFile(TEST_FILE_NAME, newData, TEST_CONTENT_TYPE);

        // Then: File is overwritten with new content
        byte[] downloadedData = minioFileStorage.downloadFile(TEST_FILE_NAME);
        assertThat(new String(downloadedData, StandardCharsets.UTF_8)).isEqualTo(newContent);
    }
}
