package com.wellkorea.backend.core.purchasing.application;

import com.wellkorea.backend.core.purchasing.api.dto.query.AttachmentReferenceView;
import com.wellkorea.backend.core.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.core.purchasing.domain.ServicePurchaseRequest;
import com.wellkorea.backend.core.purchasing.domain.vo.AttachmentReference;
import com.wellkorea.backend.core.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.supporting.storage.infrastructure.MinioFileStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing attachments on ServicePurchaseRequest.
 * Links existing files (from TaskFlow blueprints) to purchase requests.
 * Does NOT handle uploads - files must already exist in MinIO.
 */
@Service
@Transactional
public class ServicePRAttachmentService {

    private static final Logger log = LoggerFactory.getLogger(ServicePRAttachmentService.class);
    private static final int DOWNLOAD_URL_EXPIRY_MINUTES = 60;

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final MinioFileStorage minioFileStorage;

    public ServicePRAttachmentService(PurchaseRequestRepository purchaseRequestRepository,
                                      MinioFileStorage minioFileStorage) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.minioFileStorage = minioFileStorage;
    }

    /**
     * Link an existing file (from TaskFlow) to a ServicePurchaseRequest.
     *
     * @param purchaseRequestId The purchase request ID
     * @param command           Link command with file details
     * @param userId            User performing the action
     * @return The created reference ID
     * @throws ResourceNotFoundException if purchase request not found
     * @throws BusinessException         if not a service PR or file doesn't exist
     */
    public String linkAttachment(Long purchaseRequestId, LinkAttachmentCommand command, Long userId) {
        ServicePurchaseRequest pr = getServicePurchaseRequest(purchaseRequestId);

        // Verify file exists in MinIO
        if (!minioFileStorage.fileExists(command.storagePath())) {
            throw new BusinessException("File not found in storage. May have been deleted.");
        }

        AttachmentReference ref = pr.linkAttachment(
                command.fileName(),
                command.fileType(),
                command.fileSize(),
                command.storagePath(),
                userId
        );
        purchaseRequestRepository.save(pr);

        log.info("Linked attachment '{}' to purchase request {} (referenceId: {})",
                command.fileName(), purchaseRequestId, ref.getReferenceId());

        return ref.getReferenceId();
    }

    /**
     * Unlink an attachment from ServicePurchaseRequest.
     * Does NOT delete the actual file (it belongs to TaskFlow).
     *
     * @param purchaseRequestId The purchase request ID
     * @param referenceId       The attachment reference ID to unlink
     * @throws ResourceNotFoundException if purchase request or attachment not found
     * @throws BusinessException         if not a service PR
     */
    public void unlinkAttachment(Long purchaseRequestId, String referenceId) {
        ServicePurchaseRequest pr = getServicePurchaseRequest(purchaseRequestId);

        // Verify the attachment exists before unlinking
        pr.findAttachmentById(referenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment reference", referenceId));

        pr.unlinkAttachment(referenceId);
        purchaseRequestRepository.save(pr);

        log.info("Unlinked attachment {} from purchase request {}", referenceId, purchaseRequestId);
    }

    /**
     * Get linked attachments for a purchase request.
     * Returns empty list for MaterialPurchaseRequest (polymorphic).
     *
     * @param purchaseRequestId The purchase request ID
     * @return List of attachment views (empty for Material type)
     * @throws ResourceNotFoundException if purchase request not found
     */
    @Transactional(readOnly = true)
    public List<AttachmentReferenceView> getLinkedAttachments(Long purchaseRequestId) {
        PurchaseRequest pr = purchaseRequestRepository.findById(purchaseRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request", purchaseRequestId));

        // Use polymorphic getAttachments() - returns empty for Material
        return pr.getAttachments().stream()
                .map(ref -> toView(purchaseRequestId, ref))
                .toList();
    }

    /**
     * Generate presigned download URL for a linked attachment.
     *
     * @param purchaseRequestId The purchase request ID
     * @param referenceId       The attachment reference ID
     * @return Presigned URL valid for 60 minutes
     * @throws ResourceNotFoundException if purchase request or attachment not found
     * @throws BusinessException         if not a service PR
     */
    @Transactional(readOnly = true)
    public String generateDownloadUrl(Long purchaseRequestId, String referenceId) {
        ServicePurchaseRequest pr = getServicePurchaseRequest(purchaseRequestId);
        AttachmentReference ref = pr.findAttachmentById(referenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment reference", referenceId));

        return minioFileStorage.generatePresignedUrl(
                ref.getStoragePath(),
                DOWNLOAD_URL_EXPIRY_MINUTES,
                TimeUnit.MINUTES
        );
    }

    private ServicePurchaseRequest getServicePurchaseRequest(Long id) {
        PurchaseRequest pr = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request", id));
        if (!(pr instanceof ServicePurchaseRequest spr)) {
            throw new BusinessException("Attachments can only be linked to service purchase requests");
        }
        return spr;
    }

    private AttachmentReferenceView toView(Long purchaseRequestId, AttachmentReference ref) {
        return new AttachmentReferenceView(
                ref.getReferenceId(),
                purchaseRequestId,
                ref.getFileName(),
                ref.getFileType().name(),
                ref.getFileSize(),
                ref.getFormattedFileSize(),
                ref.getStoragePath(),
                ref.getLinkedById(),
                ref.getLinkedAt()
        );
    }
}
