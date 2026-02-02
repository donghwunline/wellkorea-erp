package com.wellkorea.backend.core.purchasing.application;

import com.wellkorea.backend.core.purchasing.application.dto.CreatePurchaseOrderCommand;
import com.wellkorea.backend.core.purchasing.application.dto.UpdatePurchaseOrderCommand;
import com.wellkorea.backend.core.purchasing.domain.PurchaseOrder;
import com.wellkorea.backend.core.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.core.purchasing.domain.event.PurchaseOrderCanceledEvent;
import com.wellkorea.backend.core.purchasing.domain.event.PurchaseOrderConfirmedEvent;
import com.wellkorea.backend.core.purchasing.domain.event.PurchaseOrderCreatedEvent;
import com.wellkorea.backend.core.purchasing.domain.event.PurchaseOrderReceivedEvent;
import com.wellkorea.backend.core.purchasing.domain.service.PurchaseOrderCreationGuard;
import com.wellkorea.backend.core.purchasing.infrastructure.persistence.PurchaseOrderRepository;
import com.wellkorea.backend.core.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.shared.event.DomainEventPublisher;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;

/**
 * Command service for purchase order write operations.
 */
@Service
@Transactional
public class PurchaseOrderCommandService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseOrderCreationGuard purchaseOrderCreationGuard;
    private final DomainEventPublisher eventPublisher;

    public PurchaseOrderCommandService(PurchaseOrderRepository purchaseOrderRepository,
                                       PurchaseRequestRepository purchaseRequestRepository,
                                       PurchaseOrderCreationGuard purchaseOrderCreationGuard,
                                       DomainEventPublisher eventPublisher) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.purchaseOrderCreationGuard = purchaseOrderCreationGuard;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create a new purchase order from an RFQ item.
     * <p>
     * Uses the aggregate factory method on PurchaseRequest to create the PO,
     * encapsulating RfqItem validation and vendor selection within the aggregate.
     *
     * @return the created purchase order ID
     */
    public Long createPurchaseOrder(CreatePurchaseOrderCommand command, Long userId) {
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(command.purchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + command.purchaseRequestId()));

        // Validate dates
        if (command.expectedDeliveryDate().isBefore(command.orderDate())) {
            throw new BusinessException("Expected delivery date cannot be before order date");
        }

        String poNumber = generatePoNumber();

        // Create PO via aggregate factory method - RfqItem internals are encapsulated
        // Guard handles duplicate check
        PurchaseOrder purchaseOrder = purchaseRequest.createPurchaseOrder(
                command.rfqItemId(),
                purchaseOrderCreationGuard,
                poNumber,
                command.orderDate(),
                command.expectedDeliveryDate(),
                userId,
                command.notes()
        );

        // Save both - PR may have status change (VENDOR_SELECTED)
        purchaseRequestRepository.save(purchaseRequest);
        purchaseOrder = purchaseOrderRepository.save(purchaseOrder);

        // Publish event to transition PurchaseRequest to ORDERED
        eventPublisher.publish(new PurchaseOrderCreatedEvent(
                purchaseOrder.getId(),
                purchaseRequest.getId(),
                purchaseOrder.getPoNumber()
        ));

        return purchaseOrder.getId();
    }

    /**
     * Update an existing purchase order.
     *
     * @return the updated purchase order ID
     */
    public Long updatePurchaseOrder(Long id, UpdatePurchaseOrderCommand command) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with ID: " + id));

        // Determine values for update (use current values if not provided in command)
        LocalDate newExpectedDeliveryDate = command.expectedDeliveryDate() != null
                ? command.expectedDeliveryDate()
                : purchaseOrder.getExpectedDeliveryDate();

        String newNotes = command.notes() != null ? command.notes() : purchaseOrder.getNotes();

        // Use domain method (validates DRAFT status)
        purchaseOrder.update(newExpectedDeliveryDate, newNotes);

        purchaseOrder = purchaseOrderRepository.save(purchaseOrder);
        return purchaseOrder.getId();
    }

    /**
     * Send a purchase order to the vendor.
     */
    public Long sendPurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with ID: " + id));

        purchaseOrder.send();
        purchaseOrder = purchaseOrderRepository.save(purchaseOrder);
        return purchaseOrder.getId();
    }

    /**
     * Confirm a purchase order (vendor has confirmed).
     * Publishes PurchaseOrderConfirmedEvent to create AccountsPayable.
     */
    public Long confirmPurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with ID: " + id));

        purchaseOrder.confirm();
        purchaseOrder = purchaseOrderRepository.save(purchaseOrder);

        // Publish event to create AccountsPayable
        eventPublisher.publish(new PurchaseOrderConfirmedEvent(
                purchaseOrder.getId(),
                purchaseOrder.getVendorCompanyId(),
                purchaseOrder.getPoNumber(),
                purchaseOrder.getTotalAmount(),
                purchaseOrder.getCurrency()
        ));

        return purchaseOrder.getId();
    }

    /**
     * Mark a purchase order as received.
     * Publishes a PurchaseOrderReceivedEvent to close the PurchaseRequest.
     */
    public Long receivePurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with ID: " + id));

        PurchaseRequest purchaseRequest = purchaseOrder.getPurchaseRequest();
        if (purchaseRequest == null) {
            throw new BusinessException("Purchase order has no associated purchase request");
        }

        purchaseOrder.receive();
        purchaseOrderRepository.save(purchaseOrder);

        // Publish event to close the PurchaseRequest
        eventPublisher.publish(new PurchaseOrderReceivedEvent(
                purchaseOrder.getId(),
                purchaseRequest.getId(),
                purchaseOrder.getPoNumber()
        ));

        return purchaseOrder.getId();
    }

    /**
     * Cancel a purchase order.
     * Publishes a PurchaseOrderCanceledEvent to revert the PurchaseRequest status.
     */
    public void cancelPurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with ID: " + id));

        PurchaseRequest purchaseRequest = purchaseOrder.getPurchaseRequest();
        if (purchaseRequest == null) {
            throw new BusinessException("Purchase order has no associated purchase request");
        }

        purchaseOrder.cancel();
        purchaseOrderRepository.save(purchaseOrder);

        // Publish event to revert PurchaseRequest status
        eventPublisher.publish(new PurchaseOrderCanceledEvent(
                purchaseOrder.getId(),
                purchaseRequest.getId(),
                purchaseOrder.getRfqItemId(),
                purchaseOrder.getPoNumber()
        ));
    }

    /**
     * Generate a unique PO number in format PO-YYYY-NNNNNN.
     */
    private String generatePoNumber() {
        String prefix = "PO-" + Year.now().getValue() + "-";
        Integer maxSequence = purchaseOrderRepository.findMaxSequenceForYear(prefix);
        int nextSequence = (maxSequence == null) ? 1 : maxSequence + 1;
        return String.format("%s%06d", prefix, nextSequence);
    }
}
