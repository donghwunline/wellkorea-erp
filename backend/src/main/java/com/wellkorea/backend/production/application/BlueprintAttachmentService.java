package com.wellkorea.backend.production.application;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.shared.storage.infrastructure.MinioFileStorage;
import com.wellkorea.backend.shared.storage.api.dto.UploadUrlResponse;
import com.wellkorea.backend.production.api.dto.query.BlueprintAttachmentView;
import com.wellkorea.backend.production.domain.AllowedFileType;
import com.wellkorea.backend.production.domain.BlueprintAttachment;
import com.wellkorea.backend.production.domain.TaskFlow;
import com.wellkorea.backend.production.infrastructure.persistence.BlueprintAttachmentRepository;
import com.wellkorea.backend.production.infrastructure.persistence.TaskFlowRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing blueprint attachments on TaskFlow nodes.
 * Handles file upload to MinIO and metadata storage in database.
 */
@Service
@Transactional
public class BlueprintAttachmentService {

    private static final Logger log = LoggerFactory.getLogger(BlueprintAttachmentService.class);
    private static final String STORAGE_PREFIX = "blueprints";

    private final BlueprintAttachmentRepository attachmentRepository;
    private final TaskFlowRepository taskFlowRepository;
    private final UserRepository userRepository;
    private final MinioFileStorage minioFileStorage;

    public BlueprintAttachmentService(BlueprintAttachmentRepository attachmentRepository,
                                       TaskFlowRepository taskFlowRepository,
                                       UserRepository userRepository,
                                       MinioFileStorage minioFileStorage) {
        this.attachmentRepository = attachmentRepository;
        this.taskFlowRepository = taskFlowRepository;
        this.userRepository = userRepository;
        this.minioFileStorage = minioFileStorage;
    }

    /**
     * Generate a presigned URL for direct upload to MinIO.
     * Client will use this URL to upload file directly to MinIO without proxying through backend.
     *
     * @param flowId      TaskFlow ID
     * @param nodeId      Node ID within the TaskFlow
     * @param fileName    Original file name
     * @param fileSize    File size in bytes
     * @param contentType MIME type
     * @return UploadUrlResponse with presigned URL and object key
     */
    public UploadUrlResponse generateUploadUrl(Long flowId, String nodeId,
                                                String fileName, Long fileSize, String contentType) {
        // Validate TaskFlow exists
        TaskFlow taskFlow = taskFlowRepository.findById(flowId)
                .orElseThrow(() -> new ResourceNotFoundException("TaskFlow", flowId));

        // Validate node exists in the TaskFlow
        boolean nodeExists = taskFlow.getNodes().stream()
                .anyMatch(node -> node.getNodeId().equals(nodeId));
        if (!nodeExists) {
            throw new BusinessException("Node '" + nodeId + "' not found in TaskFlow " + flowId);
        }

        // Validate file type
        if (!AllowedFileType.isAllowed(fileName)) {
            throw new BusinessException("File type not allowed. Allowed types: " + AllowedFileType.getAllowedExtensions());
        }

        // Check for duplicate file name
        if (attachmentRepository.existsByTaskFlowIdAndNodeIdAndFileName(flowId, nodeId, fileName)) {
            throw new BusinessException("A file named '" + fileName + "' already exists for this task node");
        }

        // Generate storage path
        String storagePath = generateStoragePath(flowId, nodeId, fileName);

        // Generate presigned upload URL (15 minutes expiry)
        String uploadUrl = minioFileStorage.generatePresignedUploadUrl(storagePath, 15, TimeUnit.MINUTES);

        log.info("Generated presigned upload URL for: {} in flow {} node {}", fileName, flowId, nodeId);

        return new UploadUrlResponse(uploadUrl, storagePath);
    }

    /**
     * Register an attachment after successful direct upload to MinIO.
     * Called by client after uploading file directly to MinIO using presigned URL.
     *
     * @param flowId    TaskFlow ID
     * @param nodeId    Node ID within the TaskFlow
     * @param fileName  Original file name
     * @param fileSize  File size in bytes
     * @param objectKey MinIO object key (storage path)
     * @param userId    User who uploaded the file
     * @return ID of created attachment
     */
    public Long registerAttachment(Long flowId, String nodeId,
                                    String fileName, Long fileSize, String objectKey, Long userId) {
        // Validate TaskFlow exists
        TaskFlow taskFlow = taskFlowRepository.findById(flowId)
                .orElseThrow(() -> new ResourceNotFoundException("TaskFlow", flowId));

        // Validate node exists
        boolean nodeExists = taskFlow.getNodes().stream()
                .anyMatch(node -> node.getNodeId().equals(nodeId));
        if (!nodeExists) {
            throw new BusinessException("Node '" + nodeId + "' not found in TaskFlow " + flowId);
        }

        // Verify file exists in MinIO
        if (!minioFileStorage.fileExists(objectKey)) {
            throw new BusinessException("File not found in storage. Upload may have failed.");
        }

        // Get user
        User uploadedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Create attachment entity
        BlueprintAttachment attachment = BlueprintAttachment.create(
                taskFlow,
                nodeId,
                fileName,
                fileSize,
                objectKey,
                uploadedBy
        );

        attachment = attachmentRepository.save(attachment);
        log.info("Registered blueprint attachment: {} to node {} in flow {} (id: {})",
                fileName, nodeId, flowId, attachment.getId());

        return attachment.getId();
    }

    /**
     * Get all attachments for a task node.
     *
     * @param flowId TaskFlow ID
     * @param nodeId Node ID
     * @return List of attachment views
     */
    @Transactional(readOnly = true)
    public List<BlueprintAttachmentView> getAttachmentsByNode(Long flowId, String nodeId) {
        return attachmentRepository.findByTaskFlowIdAndNodeId(flowId, nodeId).stream()
                .map(this::toView)
                .toList();
    }

    /**
     * Get all attachments for a TaskFlow.
     *
     * @param flowId TaskFlow ID
     * @return List of attachment views
     */
    @Transactional(readOnly = true)
    public List<BlueprintAttachmentView> getAttachmentsByFlow(Long flowId) {
        return attachmentRepository.findByTaskFlowId(flowId).stream()
                .map(this::toView)
                .toList();
    }

    

    /**
     * Get attachment by ID.
     *
     * @param attachmentId Attachment ID
     * @return Attachment view
     */
    @Transactional(readOnly = true)
    public BlueprintAttachmentView getAttachment(Long attachmentId) {
        BlueprintAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("BlueprintAttachment", attachmentId));
        return toView(attachment);
    }

    /**
     * Delete an attachment.
     *
     * @param attachmentId Attachment ID
     */
    public void deleteAttachment(Long attachmentId) {
        BlueprintAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("BlueprintAttachment", attachmentId));

        // Delete from MinIO
        try {
            minioFileStorage.deleteFile(attachment.getStoragePath());
        } catch (Exception e) {
            log.warn("Failed to delete file from MinIO: {}. Proceeding with database deletion.",
                    attachment.getStoragePath(), e);
        }

        // Delete from database
        attachmentRepository.delete(attachment);
        log.info("Deleted blueprint attachment: {} (id: {})", attachment.getFileName(), attachmentId);
    }

    /**
     * Download attachment file content.
     *
     * @param attachmentId Attachment ID
     * @return File content as byte array
     */
    @Transactional(readOnly = true)
    public byte[] downloadAttachment(Long attachmentId) {
        BlueprintAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("BlueprintAttachment", attachmentId));

        return minioFileStorage.downloadFile(attachment.getStoragePath());
    }

    /**
     * Generate a presigned download URL for an attachment.
     *
     * @param attachmentId Attachment ID
     * @param expiryMinutes URL expiry time in minutes
     * @return Presigned URL
     */
    @Transactional(readOnly = true)
    public String generateDownloadUrl(Long attachmentId, int expiryMinutes) {
        BlueprintAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("BlueprintAttachment", attachmentId));

        return minioFileStorage.generatePresignedUrl(
                attachment.getStoragePath(),
                expiryMinutes,
                TimeUnit.MINUTES
        );
    }

    /**
     * Generate storage path for a blueprint file.
     */
    private String generateStoragePath(Long flowId, String nodeId, String fileName) {
        // Pattern: blueprints/flow-{flowId}/node-{nodeId}/{fileName}
        return String.format("%s/flow-%d/node-%s/%s",
                STORAGE_PREFIX, flowId, nodeId, fileName);
    }

    /**
     * Convert entity to view DTO.
     */
    private BlueprintAttachmentView toView(BlueprintAttachment attachment) {
        return new BlueprintAttachmentView(
                attachment.getId(),
                attachment.getTaskFlow().getId(),
                attachment.getNodeId(),
                attachment.getFileName(),
                attachment.getFileType(),
                attachment.getFileSize(),
                attachment.getFormattedFileSize(),
                attachment.getStoragePath(),
                attachment.getUploadedBy().getId(),
                attachment.getUploadedBy().getFullName(),
                attachment.getUploadedAt()
        );
    }
}
