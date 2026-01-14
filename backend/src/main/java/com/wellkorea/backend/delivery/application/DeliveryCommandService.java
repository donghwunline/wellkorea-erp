package com.wellkorea.backend.delivery.application;

import com.wellkorea.backend.delivery.api.dto.command.CreateDeliveryRequest;
import com.wellkorea.backend.delivery.api.dto.command.DeliveryLineItemRequest;
import com.wellkorea.backend.delivery.domain.Delivery;
import com.wellkorea.backend.delivery.domain.DeliveryLineItemInput;
import com.wellkorea.backend.delivery.domain.QuotationDeliveryGuard;
import com.wellkorea.backend.delivery.infrastructure.persistence.DeliveryRepository;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.lock.ProjectLock;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Command service for delivery write operations.
 * Part of CQRS pattern - handles all create/update/delete operations.
 * Returns only entity IDs - clients should fetch fresh data via DeliveryQueryService.
 * <p>
 * Uses {@link ProjectLock} annotation for distributed locking to prevent race conditions
 * during concurrent delivery creation for the same project.
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

    public DeliveryCommandService(DeliveryRepository deliveryRepository,
                                  ProjectRepository projectRepository,
                                  QuotationRepository quotationRepository,
                                  QuotationDeliveryGuard quotationDeliveryGuard) {
        this.deliveryRepository = deliveryRepository;
        this.projectRepository = projectRepository;
        this.quotationRepository = quotationRepository;
        this.quotationDeliveryGuard = quotationDeliveryGuard;
    }

    /**
     * Create a new delivery with line items.
     * <p>
     * Acquires a distributed lock on the project (via {@link ProjectLock}) to prevent
     * race conditions during concurrent delivery creation. The lock ensures:
     * <ul>
     *   <li>Consistent quotation data during validation</li>
     *   <li>Accurate cumulative delivered quantities</li>
     *   <li>No over-delivery beyond quotation limits</li>
     * </ul>
     * <p>
     * The quotationId is explicitly provided in the request to ensure the delivery
     * is created against the exact quotation version the user was viewing, preventing
     * race conditions where a new quotation could be approved between view and submit.
     * <p>
     * Delegates to {@link Quotation#createDelivery} factory method which validates
     * using {@link QuotationDeliveryGuard} and creates the Delivery entity.
     *
     * @param projectId     Project ID (used for distributed lock)
     * @param request       Create delivery request containing explicit quotationId
     * @param deliveredById User ID of who is recording the delivery
     * @return ID of the created delivery
     * @throws ResourceNotFoundException                                  if project or quotation doesn't exist
     * @throws BusinessException                                          if validation fails
     * @throws com.wellkorea.backend.shared.lock.LockAcquisitionException if lock cannot be acquired (concurrent operation in progress)
     */
    @ProjectLock
    public Long createDelivery(Long projectId, CreateDeliveryRequest request, Long deliveredById) {
        // Verify project exists
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId);
        }

        // Fetch the specific quotation by ID (explicit binding prevents race conditions)
        Quotation quotation = quotationRepository.findByIdWithLineItems(request.quotationId())
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", request.quotationId()));

        // Validate quotation belongs to the project
        if (!quotation.getProject().getId().equals(projectId)) {
            throw new BusinessException("Quotation does not belong to the specified project");
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
     *
     * @param deliveryId Delivery ID
     * @return ID of the updated delivery
     */
    public Long markAsDelivered(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        delivery.markDelivered();
        deliveryRepository.save(delivery);
        return deliveryId;
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
     * @param quotationId Target quotation ID
     * @return ID of the updated delivery
     */
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
        List<DeliveryLineItemInput> lineItemInputs = delivery.getLineItems().stream()
                .map(li -> new DeliveryLineItemInput(li.getProductId(), li.getQuantityDelivered()))
                .toList();
        quotationDeliveryGuard.validateAndThrow(quotation, lineItemInputs);

        delivery.reassignToQuotation(quotationId);
        deliveryRepository.save(delivery);
        return deliveryId;
    }
}
