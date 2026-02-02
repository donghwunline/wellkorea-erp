package com.wellkorea.backend.core.purchasing.domain.vo;

import com.wellkorea.backend.core.production.domain.AllowedFileType;
import com.wellkorea.backend.supporting.storage.domain.constant.AttachmentLimits;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.text.DecimalFormat;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * AttachmentReference embeddable representing a reference to an existing file (blueprint)
 * that has been linked to a ServicePurchaseRequest.
 * <p>
 * This does NOT store the file itself - files are stored in MinIO via TaskFlow/BlueprintAttachment.
 * This only stores a reference (storagePath) to the existing file for inclusion in RFQ emails.
 * <p>
 * Part of the ServicePurchaseRequest aggregate.
 */
@Embeddable
public class AttachmentReference {

    private static final String[] SIZE_UNITS = {"B", "KB", "MB", "GB"};
    private static final int MAX_FILE_NAME_LENGTH = 255;   // Matches DB column
    private static final int MAX_STORAGE_PATH_LENGTH = 500; // Matches DB column

    /**
     * UUID identifier for this attachment reference.
     */
    @Column(name = "reference_id", nullable = false, length = 36)
    private String referenceId;

    /**
     * Original file name for display.
     */
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * File type (PDF, DXF, DWG, JPG, PNG).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false, length = 10)
    private AllowedFileType fileType;

    /**
     * File size in bytes.
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * Reference to existing MinIO storage path.
     * Points to file already uploaded via TaskFlow/BlueprintAttachment.
     */
    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    /**
     * Timestamp when this reference was created.
     */
    @Column(name = "linked_at", nullable = false)
    private Instant linkedAt;

    /**
     * User ID who created this reference.
     */
    @Column(name = "linked_by_id", nullable = false)
    private Long linkedById;

    // Default constructor for JPA
    public AttachmentReference() {
    }

    /**
     * Private constructor for factory method.
     */
    private AttachmentReference(String fileName, AllowedFileType fileType, Long fileSize,
                                String storagePath, Long linkedById) {
        this.referenceId = UUID.randomUUID().toString();
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.storagePath = storagePath;
        this.linkedById = linkedById;
        this.linkedAt = Instant.now();
    }

    /**
     * Factory method to create a new attachment reference.
     *
     * @param fileName    Original file name
     * @param fileType    File type (PDF, DXF, DWG, JPG, PNG)
     * @param fileSize    File size in bytes
     * @param storagePath Existing MinIO storage path (from TaskFlow/BlueprintAttachment)
     * @param linkedById  User ID creating this reference
     * @return New AttachmentReference
     */
    public static AttachmentReference link(String fileName, AllowedFileType fileType,
                                           long fileSize, String storagePath, Long linkedById) {
        Objects.requireNonNull(fileName, "fileName must not be null");
        Objects.requireNonNull(fileType, "fileType must not be null");
        Objects.requireNonNull(storagePath, "storagePath must not be null");
        Objects.requireNonNull(linkedById, "linkedById must not be null");

        if (fileName.isBlank()) {
            throw new IllegalArgumentException("fileName cannot be blank");
        }
        if (storagePath.isBlank()) {
            throw new IllegalArgumentException("storagePath cannot be blank");
        }
        if (fileName.length() > MAX_FILE_NAME_LENGTH) {
            throw new IllegalArgumentException(
                    "fileName exceeds maximum length of " + MAX_FILE_NAME_LENGTH + " characters");
        }
        if (storagePath.length() > MAX_STORAGE_PATH_LENGTH) {
            throw new IllegalArgumentException(
                    "storagePath exceeds maximum length of " + MAX_STORAGE_PATH_LENGTH + " characters");
        }
        if (fileSize <= 0) {
            throw new IllegalArgumentException("fileSize must be positive");
        }
        if (fileSize > AttachmentLimits.MAX_FILE_SIZE) {
            throw new IllegalArgumentException("fileSize exceeds maximum allowed (50MB)");
        }

        return new AttachmentReference(fileName, fileType, fileSize, storagePath, linkedById);
    }

    /**
     * Format file size for display (e.g., "2.5 MB", "128 KB").
     */
    public String getFormattedFileSize() {
        if (fileSize == null || fileSize == 0) {
            return "0 B";
        }

        int unitIndex = 0;
        double size = fileSize;

        while (size >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        DecimalFormat df = new DecimalFormat("#.##");
        return df.format(size) + " " + SIZE_UNITS[unitIndex];
    }

    // ========== Getters ==========

    public String getReferenceId() {
        return referenceId;
    }

    public String getFileName() {
        return fileName;
    }

    public AllowedFileType getFileType() {
        return fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public Instant getLinkedAt() {
        return linkedAt;
    }

    public Long getLinkedById() {
        return linkedById;
    }

    // ========== Equals and HashCode (value-based on referenceId) ==========

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AttachmentReference that = (AttachmentReference) o;
        return Objects.equals(referenceId, that.referenceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(referenceId);
    }
}
