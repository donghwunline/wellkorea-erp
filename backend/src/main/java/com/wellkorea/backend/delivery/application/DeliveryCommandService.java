package com.wellkorea.backend.delivery.application;

import com.wellkorea.backend.delivery.api.dto.command.CreateDeliveryRequest;
import com.wellkorea.backend.delivery.api.dto.command.DeliveryLineItemRequest;
import com.wellkorea.backend.delivery.domain.Delivery;
import com.wellkorea.backend.delivery.domain.DeliveryLineItemInput;
import com.wellkorea.backend.delivery.domain.DeliveryStatus;
import com.wellkorea.backend.delivery.domain.QuotationDeliveryGuard;
import com.wellkorea.backend.delivery.infrastructure.persistence.DeliveryRepository;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.lock.QuotationLock;
import com.wellkorea.backend.shared.storage.application.AttachmentService;
import com.wellkorea.backend.shared.storage.domain.AttachmentOwnerType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Command service for delivery write operations.
 * Part of CQRS pattern - handles all create/update/delete operations.
 * Returns only entity IDs - clients should fetch fresh data via DeliveryQueryService.
 * <p>
 * Uses {@link QuotationLock} annotation for distributed locking to prevent race conditions
 * during concurrent delivery operations. Quotation-level locking is preferred because:
 * <ul>
 *   <li>Validation queries are quotation-scoped (quotation line items, delivered quantities)</li>
 *   <li>More granular than project-level - different quotations can be processed concurrently</li>
 *   <li>Aligns with domain model where deliveries are created against specific quotations</li>
 * </ul>
 * <p>
 * Delivery creation is delegated to {@link Quotation#createDelivery} factory method,
 * which uses {@link QuotationDeliveryGuard} for validation (Double Dispatch pattern).
 */
@Service
@Transactional
public class DeliveryCommandService {

    private final DeliveryRepository deliveryRepository;
    private final ProjectRepository projectRepository;
    private final QuotationRepository quotationRepository;
    private final QuotationDeliveryGuard quotationDeliveryGuard;
    private final AttachmentService attachmentService;

    public DeliveryCommandService(DeliveryRepository deliveryRepository,
                                  ProjectRepository projectRepository,
                                  QuotationRepository quotationRepository,
                                  QuotationDeliveryGuard quotationDeliveryGuard,
                                  AttachmentService attachmentService) {
        this.deliveryRepository = deliveryRepository;
        this.projectRepository = projectRepository;
        this.quotationRepository = quotationRepository;
        this.quotationDeliveryGuard = quotationDeliveryGuard;
        this.attachmentService = attachmentService;
    }

    /**
     * Create a new delivery with line items.
     * <p>
     * Acquires a distributed lock on the quotation (via {@link QuotationLock}) to prevent
     * race conditions during concurrent delivery creation. The lock ensures:
     * <ul>
     *   <li>Consistent quotation data during validation</li>
     *   <li>Accurate cumulative delivered quantities</li>
     *   <li>No over-delivery beyond quotation limits</li>
     * </ul>
     * <p>
     * The quotationId is explicitly provided to ensure the delivery is created against
     * the exact quotation version the user was viewing, preventing race conditions
     * where a new quotation could be approved between view and submit.
     * <p>
     * Delegates to {@link Quotation#createDelivery} factory method which validates
     * using {@link QuotationDeliveryGuard} and creates the Delivery entity.
     *
     * @param quotationId   Quotation ID (used for distributed lock and delivery binding)
     * @param request       Create delivery request
     * @param deliveredById User ID of who is recording the delivery
     * @return ID of the created delivery
     * @throws ResourceNotFoundException                                  if quotation doesn't exist
     * @throws BusinessException                                          if validation fails
     * @throws com.wellkorea.backend.shared.lock.LockAcquisitionException if lock cannot be acquired (concurrent operation in progress)
     */
    @QuotationLock
    public Long createDelivery(Long quotationId, CreateDeliveryRequest request, Long deliveredById) {
        // Fetch the specific quotation by ID (explicit binding prevents race conditions)
        Quotation quotation = quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        // Validate quotationId in request matches parameter (defense in depth)
        if (request.quotationId() != null && !request.quotationId().equals(quotationId)) {
            throw new BusinessException("Request quotationId does not match path parameter");
        }

        // Validate quotation is in an approved state
        if (!quotation.isApproved()) {
            throw new BusinessException("Quotation must be approved before recording deliveries. Current status: " + quotation.getStatus());
        }

        // Convert DTO line items to domain input
        List<DeliveryLineItemInput> lineItemInputs = request.lineItems().stream()
                .map(this::toLineItemInput)
                .toList();

        // Delegate to Quotation's factory method (uses Double Dispatch pattern)
        Delivery delivery = quotation.createDelivery(
                quotationDeliveryGuard,
                request.deliveryDate(),
                request.notes(),
                lineItemInputs,
                deliveredById
        );

        Delivery saved = deliveryRepository.save(delivery);
        return saved.getId();
    }

    /**
     * Convert DTO to domain input.
     */
    private DeliveryLineItemInput toLineItemInput(DeliveryLineItemRequest dto) {
        return new DeliveryLineItemInput(dto.productId(), dto.quantityDelivered());
    }

    /**
     * Mark a delivery as delivered (status change from PENDING).
     * <p>
     * NOTE: This method is deprecated for new deliveries. Use {@link #markAsDeliveredWithPhoto}
     * instead, which requires a delivery photo as proof of delivery.
     *
     * @param deliveryId Delivery ID
     * @return ID of the updated delivery
     * @deprecated Use markAsDeliveredWithPhoto for new deliveries
     */
    @Deprecated
    public Long markAsDelivered(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        delivery.markDelivered();
        deliveryRepository.save(delivery);
        return deliveryId;
    }

    /**
     * Mark a delivery as delivered with a proof-of-delivery photo.
     * <p>
     * This is an atomic operation that:
     * 1. Registers the uploaded photo as an attachment
     * 2. Marks the delivery as delivered
     * <p>
     * The photo must have already been uploaded to MinIO via the presigned URL.
     *
     * @param deliveryId Delivery ID
     * @param fileName   Original file name of the photo
     * @param fileSize   Photo file size in bytes
     * @param objectKey  MinIO storage path (from presigned URL response)
     * @param uploaderId User ID who is recording the delivery
     * @return ID of the updated delivery
     * @throws ResourceNotFoundException if delivery doesn't exist
     * @throws BusinessException if delivery is not in PENDING status
     */
    public Long markAsDeliveredWithPhoto(
            Long deliveryId,
            String fileName,
            Long fileSize,
            String objectKey,
            Long uploaderId) {

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        // Validate delivery is in PENDING status
        if (delivery.getStatus() != DeliveryStatus.PENDING) {
            throw new BusinessException(
                    "Cannot mark delivery as delivered. Current status: " + delivery.getStatus());
        }

        // Register photo attachment
        attachmentService.registerAttachment(
                AttachmentOwnerType.DELIVERY,
                deliveryId,
                fileName,
                fileSize,
                objectKey,
                uploaderId
        );

        // Mark as delivered
        delivery.markDelivered();
        deliveryRepository.save(delivery);

        return deliveryId;
    }

    /**
     * Validate that a delivery can receive a photo upload.
     *
     * @param deliveryId Delivery ID
     * @throws ResourceNotFoundException if delivery doesn't exist
     * @throws BusinessException if delivery is not in PENDING status
     */
    public void validateDeliveryForPhotoUpload(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        if (delivery.getStatus() != DeliveryStatus.PENDING) {
            throw new BusinessException(
                    "Cannot upload photo for delivery. Status must be PENDING, but is: " + delivery.getStatus());
        }
    }

    /**
     * Mark a delivery as returned (e.g., for refunds/corrections).
     *
     * @param deliveryId Delivery ID
     * @return ID of the updated delivery
     */
    public Long markAsReturned(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        delivery.markReturned();
        deliveryRepository.save(delivery);
        return deliveryId;
    }

    /**
     * Reassign a delivery to a different quotation version.
     * <p>
     * Acquires a distributed lock on the target quotation (via {@link QuotationLock}) to prevent
     * race conditions during concurrent reassignment. The lock ensures consistent validation
     * of cumulative delivered quantities against the target quotation.
     * <p>
     * Used when a new quotation is approved and existing deliveries
     * need to be linked to the new version. Validates that:
     * <ul>
     *   <li>The delivery exists</li>
     *   <li>The target quotation exists and is approved</li>
     *   <li>The quotation belongs to the same project as the delivery</li>
     *   <li>All delivered products exist in the target quotation</li>
     *   <li>Delivered quantities don't exceed quotation limits</li>
     * </ul>
     *
     * @param deliveryId  Delivery ID to reassign
     * @param quotationId Target quotation ID (used for distributed lock)
     * @return ID of the updated delivery
     * @throws ResourceNotFoundException                                  if delivery or quotation doesn't exist
     * @throws BusinessException                                          if validation fails
     * @throws com.wellkorea.backend.shared.lock.LockAcquisitionException if lock cannot be acquired (concurrent operation in progress)
     */
    @QuotationLock
    public Long reassignToQuotation(Long deliveryId, Long quotationId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        // Validate quotation belongs to the same project
        if (!quotation.getProject().getId().equals(delivery.getProjectId())) {
            throw new BusinessException("Cannot reassign delivery to quotation from different project");
        }

        // Validate quotation is in an approved state
        if (!quotation.isApproved()) {
            throw new BusinessException("Can only reassign deliveries to approved quotations");
        }

        // Validate delivery is compatible with the target quotation
        // (products exist and quantities don't exceed limits)
        // Exclude the current delivery from validation since we're moving it
        List<DeliveryLineItemInput> lineItemInputs = delivery.getLineItems().stream()
                .map(li -> new DeliveryLineItemInput(li.getProductId(), li.getQuantityDelivered()))
                .toList();
        quotationDeliveryGuard.validateAndThrow(quotation, lineItemInputs, deliveryId);

        delivery.reassignToQuotation(quotationId);
        deliveryRepository.save(delivery);
        return deliveryId;
    }
}
