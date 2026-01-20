package com.wellkorea.backend.production.domain;

import com.wellkorea.backend.auth.domain.User;
import jakarta.persistence.*;

import java.time.Instant;

/**
 * File attachment for outsourced task nodes.
 * Stores blueprints/drawings to be sent to vendors for outsourcing work.
 * <p>
 * Each attachment is linked to a specific node in a TaskFlow.
 * Files are stored in MinIO; this entity stores metadata only.
 */
@Entity
@Table(name = "blueprint_attachments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"task_flow_id", "node_id", "file_name"}))
public class BlueprintAttachment {

    private static final long MAX_FILE_SIZE = 52_428_800L; // 50MB

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_flow_id", nullable = false)
    private TaskFlow taskFlow;

    /**
     * Reference to TaskNode.nodeId within the TaskFlow.
     * Not a foreign key since TaskNode is a value object (@Embeddable).
     */
    @Column(name = "node_id", nullable = false, length = 36)
    private String nodeId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false, length = 10)
    private AllowedFileType fileType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = Instant.now();
    }

    // ========== Factory Method ==========

    /**
     * Create a new BlueprintAttachment.
     *
     * @param taskFlow    The TaskFlow this attachment belongs to
     * @param nodeId      The node ID within the TaskFlow
     * @param fileName    Original file name
     * @param fileSize    File size in bytes
     * @param storagePath MinIO storage path
     * @param uploadedBy  User who uploaded the file
     * @return New BlueprintAttachment instance
     * @throws IllegalArgumentException if validation fails
     */
    public static BlueprintAttachment create(TaskFlow taskFlow, String nodeId, String fileName,
                                              long fileSize, String storagePath, User uploadedBy) {
        // Validate file type
        AllowedFileType fileType = AllowedFileType.fromFileName(fileName);
        if (fileType == null) {
            throw new IllegalArgumentException(
                    "File type not allowed. Allowed types: " + AllowedFileType.getAllowedExtensions());
        }

        // Validate file size
        if (fileSize <= 0) {
            throw new IllegalArgumentException("File size must be positive");
        }
        if (fileSize > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed (50MB)");
        }

        BlueprintAttachment attachment = new BlueprintAttachment();
        attachment.taskFlow = taskFlow;
        attachment.nodeId = nodeId;
        attachment.fileName = fileName;
        attachment.fileType = fileType;
        attachment.fileSize = fileSize;
        attachment.storagePath = storagePath;
        attachment.uploadedBy = uploadedBy;

        return attachment;
    }

    // ========== Business Methods ==========

    /**
     * Get formatted file size for display.
     *
     * @return Human-readable file size (e.g., "2.5 MB")
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

    // ========== Getters and Setters ==========

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TaskFlow getTaskFlow() {
        return taskFlow;
    }

    public void setTaskFlow(TaskFlow taskFlow) {
        this.taskFlow = taskFlow;
    }

    public String getNodeId() {
        return nodeId;
    }

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public AllowedFileType getFileType() {
        return fileType;
    }

    public void setFileType(AllowedFileType fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public User getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(User uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }
}
