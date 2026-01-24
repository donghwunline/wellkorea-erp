package com.wellkorea.backend.shared.storage.domain;

import com.wellkorea.backend.auth.domain.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;

/**
 * Generic attachment entity for storing file metadata.
 * Uses polymorphic owner pattern to support multiple entity types.
 * <p>
 * Supported owners: Delivery, Quotation, Invoice, Project
 * <p>
 * File storage path follows the pattern:
 * attachments/{ownerType}/{ownerId}/{filename}
 */
@Entity
@Table(name = "attachments", indexes = {
        @Index(name = "idx_attachments_owner", columnList = "owner_type, owner_id")
})
public class Attachment {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false, length = 20)
    private AttachmentOwnerType ownerType;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false, length = 10)
    private AttachmentFileType fileType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    protected Attachment() {
        // JPA requires default constructor
    }

    private Attachment(AttachmentOwnerType ownerType, Long ownerId,
                       String fileName, AttachmentFileType fileType, Long fileSize,
                       String storagePath, User uploadedBy) {
        this.ownerType = ownerType;
        this.ownerId = ownerId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.storagePath = storagePath;
        this.uploadedBy = uploadedBy;
        this.uploadedAt = Instant.now();
    }

    /**
     * Factory method to create a new attachment.
     *
     * @param ownerType   Type of entity that owns this attachment
     * @param ownerId     ID of the owning entity
     * @param fileName    Original file name
     * @param fileSize    File size in bytes
     * @param storagePath Path in MinIO storage
     * @param uploadedBy  User who uploaded the file
     * @return New Attachment instance
     * @throws IllegalArgumentException if validation fails
     */
    public static Attachment create(AttachmentOwnerType ownerType, Long ownerId,
                                     String fileName, long fileSize,
                                     String storagePath, User uploadedBy) {
        // Validate inputs
        Objects.requireNonNull(ownerType, "Owner type is required");
        Objects.requireNonNull(ownerId, "Owner ID is required");
        Objects.requireNonNull(fileName, "File name is required");
        Objects.requireNonNull(storagePath, "Storage path is required");
        Objects.requireNonNull(uploadedBy, "Uploader is required");

        if (fileName.isBlank()) {
            throw new IllegalArgumentException("File name cannot be blank");
        }

        if (fileSize <= 0) {
            throw new IllegalArgumentException("File size must be positive");
        }

        if (fileSize > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum of 10MB");
        }

        AttachmentFileType fileType = AttachmentFileType.fromFileName(fileName);

        return new Attachment(ownerType, ownerId, fileName, fileType, fileSize, storagePath, uploadedBy);
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public AttachmentOwnerType getOwnerType() {
        return ownerType;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public String getFileName() {
        return fileName;
    }

    public AttachmentFileType getFileType() {
        return fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public User getUploadedBy() {
        return uploadedBy;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    // ========== Helper Methods ==========

    /**
     * Check if this is an image attachment.
     *
     * @return true if file type is JPG or PNG
     */
    public boolean isImage() {
        return fileType == AttachmentFileType.JPG || fileType == AttachmentFileType.PNG;
    }

    /**
     * Format file size for display (e.g., "1.5 MB").
     *
     * @return Human-readable file size
     */
    public String getFormattedFileSize() {
        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Attachment that = (Attachment) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Attachment{" +
                "id=" + id +
                ", ownerType=" + ownerType +
                ", ownerId=" + ownerId +
                ", fileName='" + fileName + '\'' +
                ", fileType=" + fileType +
                ", fileSize=" + fileSize +
                '}';
    }
}
