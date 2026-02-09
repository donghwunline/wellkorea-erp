package com.wellkorea.backend.core.purchasing.application;

import com.wellkorea.backend.core.catalog.domain.Material;
import com.wellkorea.backend.core.catalog.domain.ServiceCategory;
import com.wellkorea.backend.core.catalog.infrastructure.persistence.MaterialRepository;
import com.wellkorea.backend.core.catalog.infrastructure.persistence.ServiceCategoryRepository;
import com.wellkorea.backend.core.purchasing.api.dto.command.AttachmentInfo;
import com.wellkorea.backend.core.purchasing.application.dto.CreateMaterialPurchaseRequestCommand;
import com.wellkorea.backend.core.purchasing.application.dto.CreateServicePurchaseRequestCommand;
import com.wellkorea.backend.core.purchasing.application.dto.UpdatePurchaseRequestCommand;
import com.wellkorea.backend.core.purchasing.domain.MaterialPurchaseRequest;
import com.wellkorea.backend.core.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.core.purchasing.domain.ServicePurchaseRequest;
import com.wellkorea.backend.core.purchasing.domain.service.RfqItemFactory;
import com.wellkorea.backend.core.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.supporting.storage.infrastructure.MinioFileStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;

/**
 * Command service for purchase request write operations.
 * Supports both service (outsourcing) and material (physical items) purchase requests.
 */
@Service
@Transactional
public class PurchaseRequestCommandService {

    private static final Logger log = LoggerFactory.getLogger(PurchaseRequestCommandService.class);

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final MaterialRepository materialRepository;
    private final RfqItemFactory rfqItemFactory;
    private final MinioFileStorage minioFileStorage;

    public PurchaseRequestCommandService(PurchaseRequestRepository purchaseRequestRepository,
                                         ServiceCategoryRepository serviceCategoryRepository,
                                         MaterialRepository materialRepository,
                                         RfqItemFactory rfqItemFactory,
                                         MinioFileStorage minioFileStorage) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.materialRepository = materialRepository;
        this.rfqItemFactory = rfqItemFactory;
        this.minioFileStorage = minioFileStorage;
    }

    /**
     * Create a new service purchase request (outsourcing).
     *
     * @return the created purchase request ID
     */
    public Long createServicePurchaseRequest(CreateServicePurchaseRequestCommand command, Long userId) {
        log.info("Creating service purchase request: projectId={}, serviceCategoryId={}, userId={}",
                command.projectId(), command.serviceCategoryId(), userId);

        // Validate service category
        ServiceCategory serviceCategory = serviceCategoryRepository.findById(command.serviceCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Service category not found with ID: " + command.serviceCategoryId()));

        if (!serviceCategory.isActive()) {
            throw new BusinessException("Service category is not active");
        }

        // Generate request number
        String requestNumber = generateRequestNumber();

        // Create service purchase request using constructor with ID references
        ServicePurchaseRequest purchaseRequest = new ServicePurchaseRequest(
                command.projectId(),
                serviceCategory,
                requestNumber,
                command.description(),
                command.quantity(),
                command.uom(),
                command.requiredDate(),
                userId
        );

        // Link attachments in same transaction
        if (command.attachments() != null && !command.attachments().isEmpty()) {
            for (AttachmentInfo att : command.attachments()) {
                if (!minioFileStorage.fileExists(att.storagePath())) {
                    throw new BusinessException("File not found in storage: " + att.fileName());
                }
                purchaseRequest.linkAttachment(
                        att.fileName(), att.fileType(), att.fileSize(),
                        att.storagePath(), userId
                );
            }
        }

        purchaseRequest = purchaseRequestRepository.save(purchaseRequest);
        log.info("Created service purchase request: id={}, requestNumber={}", purchaseRequest.getId(), requestNumber);
        return purchaseRequest.getId();
    }

    /**
     * Create a new material purchase request (physical items).
     *
     * @return the created purchase request ID
     */
    public Long createMaterialPurchaseRequest(CreateMaterialPurchaseRequestCommand command, Long userId) {
        log.info("Creating material purchase request: projectId={}, materialId={}, userId={}",
                command.projectId(), command.materialId(), userId);

        // Validate material
        Material material = materialRepository.findById(command.materialId())
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with ID: " + command.materialId()));

        if (!material.isActive()) {
            throw new BusinessException("Material is not active");
        }

        // Generate request number
        String requestNumber = generateRequestNumber();

        // Determine UOM: use provided value or fall back to material's default unit
        String uom = command.uom() != null ? command.uom() : material.getUnit();

        // Create material purchase request using constructor with ID references
        MaterialPurchaseRequest purchaseRequest = new MaterialPurchaseRequest(
                command.projectId(),
                material,
                requestNumber,
                command.description(),
                command.quantity(),
                uom,
                command.requiredDate(),
                userId
        );

        purchaseRequest = purchaseRequestRepository.save(purchaseRequest);
        log.info("Created material purchase request: id={}, requestNumber={}", purchaseRequest.getId(), requestNumber);
        return purchaseRequest.getId();
    }

    /**
     * Update an existing purchase request.
     *
     * @return the updated purchase request ID
     */
    public Long updatePurchaseRequest(Long id, UpdatePurchaseRequestCommand command) {
        log.info("Updating purchase request id={}", id);

        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + id));

        // Use the domain's update method which enforces status check
        purchaseRequest.update(
                command.description(),
                command.quantity(),
                command.uom(),
                command.requiredDate()
        );

        purchaseRequest = purchaseRequestRepository.save(purchaseRequest);
        return purchaseRequest.getId();
    }

    /**
     * Send RFQ to vendors.
     * Delegates entirely to aggregate - domain service validates vendors and creates RfqItems.
     *
     * @return list of created RFQ item IDs for correlation with email sending
     */
    public List<String> sendRfq(Long purchaseRequestId, List<Long> vendorIds) {
        log.info("Sending RFQ for purchase request id={}: vendorCount={}", purchaseRequestId, vendorIds.size());

        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(purchaseRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + purchaseRequestId));

        // Delegate entirely to aggregate - pass domain service for item creation
        List<String> itemIds = purchaseRequest.sendRfq(vendorIds, rfqItemFactory);
        purchaseRequestRepository.save(purchaseRequest);
        log.info("RFQ sent for purchase request id={}: itemIds={}", purchaseRequestId, itemIds);

        return itemIds;
    }

    /**
     * Cancel a purchase request.
     */
    public void cancelPurchaseRequest(Long id) {
        log.info("Cancelling purchase request id={}", id);

        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + id));

        purchaseRequest.cancel();
        purchaseRequestRepository.save(purchaseRequest);
    }

    /**
     * Generate a unique request number in format PR-YYYY-NNNNNN.
     */
    private String generateRequestNumber() {
        String prefix = "PR-" + Year.now().getValue() + "-";
        Integer maxSequence = purchaseRequestRepository.findMaxSequenceForYear(prefix);
        int nextSequence = (maxSequence == null) ? 1 : maxSequence + 1;
        return String.format("%s%06d", prefix, nextSequence);
    }
}
