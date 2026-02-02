package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.catalog.domain.ServiceCategory;
import com.wellkorea.backend.production.domain.AllowedFileType;
import com.wellkorea.backend.purchasing.domain.vo.AttachmentReference;
import com.wellkorea.backend.supporting.storage.domain.constant.AttachmentLimits;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * ServicePurchaseRequest - Purchase request for outsourcing services.
 * Examples: CNC machining, laser cutting, painting, etching.
 * Links to ServiceCategory for the type of service being purchased.
 */
@Entity
@DiscriminatorValue("SERVICE")
public class ServicePurchaseRequest extends PurchaseRequest {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_category_id", nullable = false)
    private ServiceCategory serviceCategory;

    /**
     * Attachment references linked to this service purchase request.
     * References existing files in MinIO (from TaskFlow/BlueprintAttachment).
     */
    @ElementCollection
    @CollectionTable(
            name = "service_pr_attachments",
            joinColumns = @JoinColumn(name = "purchase_request_id")
    )
    private List<AttachmentReference> attachments = new ArrayList<>();

    // ========== Constructors ==========

    /**
     * Default constructor for JPA.
     */
    protected ServicePurchaseRequest() {
    }

    /**
     * Creates a new ServicePurchaseRequest with all required fields.
     *
     * @param projectId       the associated project ID (nullable)
     * @param serviceCategory the service category being purchased (required)
     * @param requestNumber   the unique request number (required)
     * @param description     the request description (required)
     * @param quantity        the requested quantity (required)
     * @param uom             the unit of measure (nullable)
     * @param requiredDate    the required delivery date (required)
     * @param createdById     the user ID creating this request (required)
     */
    public ServicePurchaseRequest(
            Long projectId,
            ServiceCategory serviceCategory,
            String requestNumber,
            String description,
            BigDecimal quantity,
            String uom,
            LocalDate requiredDate,
            Long createdById
    ) {
        super(projectId, requestNumber, description, quantity, uom, requiredDate, createdById);
        Objects.requireNonNull(serviceCategory, "serviceCategory must not be null");
        this.serviceCategory = serviceCategory;
    }

    // ========== Domain Methods ==========

    /**
     * Get the item name for display (service category name).
     */
    @Override
    public String getItemName() {
        return serviceCategory != null ? serviceCategory.getName() : null;
    }

    // ========== Attachment Support ==========

    /**
     * Get linked attachments for this service purchase request.
     *
     * @return Unmodifiable list of attachment references
     */
    @Override
    public List<AttachmentReference> getAttachments() {
        return Collections.unmodifiableList(attachments);
    }

    /**
     * Find an attachment by its referenceId.
     *
     * @param referenceId The UUID reference ID
     * @return Optional containing the attachment if found
     */
    public Optional<AttachmentReference> findAttachmentById(String referenceId) {
        return attachments.stream()
                .filter(ref -> ref.getReferenceId().equals(referenceId))
                .findFirst();
    }

    /**
     * Link an existing file (from TaskFlow/BlueprintAttachment) to this purchase request.
     * Does NOT upload a new file - just creates a reference to an existing MinIO path.
     *
     * @param fileName    Original file name
     * @param fileType    File type (PDF, DXF, DWG, JPG, PNG)
     * @param fileSize    File size in bytes
     * @param storagePath Existing MinIO storage path
     * @param linkedById  User ID linking this attachment
     * @return The created AttachmentReference
     * @throws IllegalArgumentException if the same file is already linked
     */
    public AttachmentReference linkAttachment(String fileName, AllowedFileType fileType,
                                              long fileSize, String storagePath, Long linkedById) {
        // Check for duplicate storage path (same file linked twice)
        boolean alreadyLinked = attachments.stream()
                .anyMatch(ref -> ref.getStoragePath().equals(storagePath));
        if (alreadyLinked) {
            throw new IllegalArgumentException("Attachment already linked: " + storagePath);
        }

        // Check attachment count limit
        if (attachments.size() >= AttachmentLimits.MAX_ATTACHMENT_COUNT) {
            throw new IllegalStateException(
                    "Maximum number of attachments (" + AttachmentLimits.MAX_ATTACHMENT_COUNT + ") reached");
        }

        // Check total size limit
        long currentTotalSize = attachments.stream()
                .mapToLong(AttachmentReference::getFileSize)
                .sum();
        if (currentTotalSize + fileSize > AttachmentLimits.MAX_TOTAL_SIZE) {
            throw new IllegalStateException(
                    "Total attachment size would exceed limit of 20MB");
        }

        AttachmentReference ref = AttachmentReference.link(fileName, fileType, fileSize, storagePath, linkedById);
        attachments.add(ref);
        return ref;
    }

    /**
     * Unlink an attachment from this purchase request.
     * Does NOT delete the actual file (it belongs to TaskFlow).
     *
     * @param referenceId The reference ID to unlink
     */
    public void unlinkAttachment(String referenceId) {
        attachments.removeIf(ref -> ref.getReferenceId().equals(referenceId));
    }
}
