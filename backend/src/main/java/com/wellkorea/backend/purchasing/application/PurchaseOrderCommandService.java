package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.purchasing.domain.PurchaseOrder;
import com.wellkorea.backend.purchasing.domain.PurchaseOrderStatus;
import com.wellkorea.backend.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.purchasing.domain.RfqItem;
import com.wellkorea.backend.purchasing.domain.RfqItemStatus;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderCanceledEvent;
import com.wellkorea.backend.purchasing.infrastructure.persistence.PurchaseOrderRepository;
import com.wellkorea.backend.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.shared.event.DomainEventPublisher;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

/**
 * Command service for purchase order write operations.
 */
@Service
@Transactional
public class PurchaseOrderCommandService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;

    public PurchaseOrderCommandService(PurchaseOrderRepository purchaseOrderRepository,
                                       PurchaseRequestRepository purchaseRequestRepository,
                                       CompanyRepository companyRepository,
                                       UserRepository userRepository,
                                       DomainEventPublisher eventPublisher) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create a new purchase order from an RFQ item.
     *
     * @return the created purchase order ID
     */
    public Long createPurchaseOrder(CreatePurchaseOrderCommand command, Long userId) {
        // Validate purchase request and get RFQ item
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(command.purchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + command.purchaseRequestId()));

        RfqItem rfqItem = purchaseRequest.findRfqItemById(command.rfqItemId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RFQ item not found with ID: " + command.rfqItemId() + " in purchase request: " + command.purchaseRequestId()));

        if (rfqItem.getStatus() != RfqItemStatus.REPLIED && rfqItem.getStatus() != RfqItemStatus.SELECTED) {
            throw new BusinessException("RFQ item must be in REPLIED or SELECTED status to create PO");
        }

        // Check if PO already exists for this RFQ
        if (purchaseOrderRepository.existsByPurchaseRequestIdAndRfqItemId(command.purchaseRequestId(), command.rfqItemId())) {
            throw new BusinessException("Purchase order already exists for this RFQ item");
        }

        // Validate dates
        if (command.expectedDeliveryDate().isBefore(command.orderDate())) {
            throw new BusinessException("Expected delivery date cannot be before order date");
        }

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Get vendor company
        Company vendor = companyRepository.findById(rfqItem.getVendorCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + rfqItem.getVendorCompanyId()));

        // Generate PO number
        String poNumber = generatePoNumber();

        // If RFQ item is in REPLIED status, select it through the aggregate
        if (rfqItem.getStatus() == RfqItemStatus.REPLIED) {
            purchaseRequest.selectVendor(command.rfqItemId());
            purchaseRequestRepository.save(purchaseRequest);
        }

        // Create purchase order
        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setPurchaseRequest(purchaseRequest);
        purchaseOrder.setRfqItemId(command.rfqItemId());
        purchaseOrder.setProject(purchaseRequest.getProject());
        purchaseOrder.setVendor(vendor);
        purchaseOrder.setPoNumber(poNumber);
        purchaseOrder.setOrderDate(command.orderDate());
        purchaseOrder.setExpectedDeliveryDate(command.expectedDeliveryDate());
        purchaseOrder.setTotalAmount(rfqItem.getQuotedPrice());
        purchaseOrder.setCurrency("KRW");
        purchaseOrder.setStatus(PurchaseOrderStatus.DRAFT);
        purchaseOrder.setNotes(command.notes());
        purchaseOrder.setCreatedBy(user);

        purchaseOrder = purchaseOrderRepository.save(purchaseOrder);
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

        if (!purchaseOrder.canUpdate()) {
            throw new BusinessException("Cannot update purchase order in " + purchaseOrder.getStatus() + " status");
        }

        if (command.expectedDeliveryDate() != null) {
            if (command.expectedDeliveryDate().isBefore(purchaseOrder.getOrderDate())) {
                throw new BusinessException("Expected delivery date cannot be before order date");
            }
            purchaseOrder.setExpectedDeliveryDate(command.expectedDeliveryDate());
        }
        if (command.notes() != null) {
            purchaseOrder.setNotes(command.notes());
        }

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
     */
    public Long confirmPurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with ID: " + id));

        purchaseOrder.confirm();
        purchaseOrder = purchaseOrderRepository.save(purchaseOrder);
        return purchaseOrder.getId();
    }

    /**
     * Mark a purchase order as received.
     */
    public Long receivePurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with ID: " + id));

        purchaseOrder.receive();
        purchaseOrder = purchaseOrderRepository.save(purchaseOrder);

        // Also close the purchase request
        PurchaseRequest purchaseRequest = purchaseOrder.getPurchaseRequest();
        if (purchaseRequest != null) {
            purchaseRequest.close();
            purchaseRequestRepository.save(purchaseRequest);
        }

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
