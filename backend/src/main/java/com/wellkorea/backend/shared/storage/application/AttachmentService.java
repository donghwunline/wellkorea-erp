package com.wellkorea.backend.shared.storage.application;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.storage.api.dto.AttachmentView;
import com.wellkorea.backend.shared.storage.api.dto.UploadUrlResponse;
import com.wellkorea.backend.shared.storage.domain.Attachment;
import com.wellkorea.backend.shared.storage.domain.AttachmentFileType;
import com.wellkorea.backend.shared.storage.domain.AttachmentOwnerType;
import com.wellkorea.backend.shared.storage.infrastructure.FilePathGenerator;
import com.wellkorea.backend.shared.storage.infrastructure.MinioFileStorage;
import com.wellkorea.backend.shared.storage.infrastructure.persistence.AttachmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing file attachments.
 * Provides upload URL generation, attachment registration, retrieval, and deletion.
 */
@Service
@Transactional
public class AttachmentService {

    private static final Logger log = LoggerFactory.getLogger(AttachmentService.class);

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final int UPLOAD_URL_EXPIRY_MINUTES = 15;
    private static final int DOWNLOAD_URL_EXPIRY_MINUTES = 60;

    private final MinioFileStorage fileStorage;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;

    public AttachmentService(MinioFileStorage fileStorage,
                             AttachmentRepository attachmentRepository,
                             UserRepository userRepository) {
        this.fileStorage = fileStorage;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Generate a presigned URL for uploading a file.
     *
     * @param ownerType   Type of entity that will own this attachment
     * @param ownerId     ID of the owning entity
     * @param fileName    Original file name
     * @param fileSize    File size in bytes
     * @param contentType MIME type of the file
     * @param imagesOnly  If true, only allow image files (JPG, PNG)
     * @return UploadUrlResponse containing presigned URL and object key
     * @throws BusinessException if validation fails
     */
    public UploadUrlResponse generateUploadUrl(
            AttachmentOwnerType ownerType,
            Long ownerId,
            String fileName,
            Long fileSize,
            String contentType,
            boolean imagesOnly) {

        // Validate file size
        if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
            throw new BusinessException("File size must be between 1 byte and 10MB");
        }

        // Validate file type
        if (imagesOnly) {
            if (!AttachmentFileType.isAllowedImage(fileName)) {
                throw new BusinessException("Only JPG and PNG images are allowed");
            }
        } else {
            if (!AttachmentFileType.isAllowed(fileName)) {
                throw new BusinessException("Only JPG, PNG, and PDF files are allowed");
            }
        }

        // Generate storage path
        String objectKey = FilePathGenerator.forAttachment(
                ownerType.name().toLowerCase(),
                ownerId,
                fileName
        );

        // Generate presigned upload URL
        String uploadUrl = fileStorage.generatePresignedUploadUrl(
                objectKey,
                UPLOAD_URL_EXPIRY_MINUTES,
                TimeUnit.MINUTES
        );

        log.info("Generated upload URL for {} {} attachment: {}",
                ownerType, ownerId, objectKey);

        return UploadUrlResponse.of(uploadUrl, objectKey);
    }

    /**
     * Register an attachment after successful upload.
     *
     * @param ownerType  Type of entity that owns this attachment
     * @param ownerId    ID of the owning entity
     * @param fileName   Original file name
     * @param fileSize   File size in bytes
     * @param objectKey  Storage path (returned from generateUploadUrl)
     * @param uploaderId ID of the user uploading the file
     * @return ID of the created attachment
     */
    public Long registerAttachment(
            AttachmentOwnerType ownerType,
            Long ownerId,
            String fileName,
            Long fileSize,
            String objectKey,
            Long uploaderId) {

        User uploader = userRepository.findById(uploaderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", uploaderId));

        // Verify file exists in MinIO
        if (!fileStorage.fileExists(objectKey)) {
            throw new BusinessException("File not found in storage. Please upload the file first.");
        }

        Attachment attachment = Attachment.create(
                ownerType,
                ownerId,
                fileName,
                fileSize,
                objectKey,
                uploader
        );

        attachmentRepository.save(attachment);

        log.info("Registered attachment {} for {} {}", attachment.getId(), ownerType, ownerId);

        return attachment.getId();
    }

    /**
     * Get the first attachment for an owner (for single-attachment entities like delivery photo).
     *
     * @param ownerType Type of entity
     * @param ownerId   ID of the entity
     * @return Optional AttachmentView with download URL
     */
    @Transactional(readOnly = true)
    public Optional<AttachmentView> getAttachment(AttachmentOwnerType ownerType, Long ownerId) {
        return attachmentRepository.findFirstByOwnerTypeAndOwnerId(ownerType, ownerId)
                .map(this::toViewWithDownloadUrl);
    }

    /**
     * Get all attachments for an owner.
     *
     * @param ownerType Type of entity
     * @param ownerId   ID of the entity
     * @return List of AttachmentView with download URLs
     */
    @Transactional(readOnly = true)
    public List<AttachmentView> getAttachments(AttachmentOwnerType ownerType, Long ownerId) {
        return attachmentRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId)
                .stream()
                .map(this::toViewWithDownloadUrl)
                .toList();
    }

    /**
     * Get an attachment by ID.
     *
     * @param attachmentId Attachment ID
     * @return AttachmentView with download URL
     * @throws ResourceNotFoundException if attachment not found
     */
    @Transactional(readOnly = true)
    public AttachmentView getAttachmentById(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", attachmentId));
        return toViewWithDownloadUrl(attachment);
    }

    /**
     * Generate a download URL for an attachment.
     *
     * @param attachmentId Attachment ID
     * @param expiryMinutes URL expiry time in minutes
     * @return Presigned download URL
     */
    @Transactional(readOnly = true)
    public String generateDownloadUrl(Long attachmentId, int expiryMinutes) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", attachmentId));

        return fileStorage.generatePresignedUrl(
                attachment.getStoragePath(),
                expiryMinutes,
                TimeUnit.MINUTES
        );
    }

    /**
     * Delete an attachment.
     *
     * @param attachmentId Attachment ID
     */
    public void deleteAttachment(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", attachmentId));

        // Delete from MinIO
        try {
            fileStorage.deleteFile(attachment.getStoragePath());
        } catch (Exception e) {
            log.warn("Failed to delete file from MinIO: {}", attachment.getStoragePath(), e);
            // Continue to delete the database record even if MinIO deletion fails
        }

        // Delete from database
        attachmentRepository.delete(attachment);

        log.info("Deleted attachment {} ({})", attachmentId, attachment.getStoragePath());
    }

    /**
     * Delete all attachments for an owner.
     *
     * @param ownerType Type of entity
     * @param ownerId   ID of the entity
     */
    public void deleteAttachments(AttachmentOwnerType ownerType, Long ownerId) {
        List<Attachment> attachments = attachmentRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId);

        for (Attachment attachment : attachments) {
            try {
                fileStorage.deleteFile(attachment.getStoragePath());
            } catch (Exception e) {
                log.warn("Failed to delete file from MinIO: {}", attachment.getStoragePath(), e);
            }
        }

        attachmentRepository.deleteByOwnerTypeAndOwnerId(ownerType, ownerId);

        log.info("Deleted {} attachments for {} {}", attachments.size(), ownerType, ownerId);
    }

    /**
     * Check if an attachment exists for an owner.
     *
     * @param ownerType Type of entity
     * @param ownerId   ID of the entity
     * @return true if at least one attachment exists
     */
    @Transactional(readOnly = true)
    public boolean hasAttachment(AttachmentOwnerType ownerType, Long ownerId) {
        return attachmentRepository.existsByOwnerTypeAndOwnerId(ownerType, ownerId);
    }

    private AttachmentView toViewWithDownloadUrl(Attachment attachment) {
        String downloadUrl = fileStorage.generatePresignedUrl(
                attachment.getStoragePath(),
                DOWNLOAD_URL_EXPIRY_MINUTES,
                TimeUnit.MINUTES
        );
        return AttachmentView.fromEntity(attachment, downloadUrl);
    }
}
