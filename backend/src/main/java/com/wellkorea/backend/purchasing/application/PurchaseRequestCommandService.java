package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.catalog.domain.Material;
import com.wellkorea.backend.catalog.domain.ServiceCategory;
import com.wellkorea.backend.catalog.infrastructure.persistence.MaterialRepository;
import com.wellkorea.backend.catalog.infrastructure.persistence.ServiceCategoryRepository;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.vo.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.purchasing.domain.MaterialPurchaseRequest;
import com.wellkorea.backend.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.purchasing.domain.ServicePurchaseRequest;
import com.wellkorea.backend.purchasing.domain.vo.PurchaseRequestStatus;
import com.wellkorea.backend.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
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

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final MaterialRepository materialRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public PurchaseRequestCommandService(PurchaseRequestRepository purchaseRequestRepository,
                                         ServiceCategoryRepository serviceCategoryRepository,
                                         MaterialRepository materialRepository,
                                         ProjectRepository projectRepository,
                                         CompanyRepository companyRepository,
                                         UserRepository userRepository) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.materialRepository = materialRepository;
        this.projectRepository = projectRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new service purchase request (outsourcing).
     *
     * @return the created purchase request ID
     */
    public Long createServicePurchaseRequest(CreateServicePurchaseRequestCommand command, Long userId) {
        // Validate service category
        ServiceCategory serviceCategory = serviceCategoryRepository.findById(command.serviceCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Service category not found with ID: " + command.serviceCategoryId()));

        if (!serviceCategory.isActive()) {
            throw new BusinessException("Service category is not active");
        }

        // Validate project if provided
        Project project = null;
        if (command.projectId() != null) {
            project = projectRepository.findById(command.projectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + command.projectId()));
        }

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Generate request number
        String requestNumber = generateRequestNumber();

        // Create service purchase request
        ServicePurchaseRequest purchaseRequest = new ServicePurchaseRequest();
        purchaseRequest.setProject(project);
        purchaseRequest.setServiceCategory(serviceCategory);
        purchaseRequest.setRequestNumber(requestNumber);
        purchaseRequest.setDescription(command.description());
        purchaseRequest.setQuantity(command.quantity());
        purchaseRequest.setUom(command.uom());
        purchaseRequest.setRequiredDate(command.requiredDate());
        purchaseRequest.setStatus(PurchaseRequestStatus.DRAFT);
        purchaseRequest.setCreatedBy(user);

        purchaseRequest = purchaseRequestRepository.save(purchaseRequest);
        return purchaseRequest.getId();
    }

    /**
     * Create a new material purchase request (physical items).
     *
     * @return the created purchase request ID
     */
    public Long createMaterialPurchaseRequest(CreateMaterialPurchaseRequestCommand command, Long userId) {
        // Validate material
        Material material = materialRepository.findById(command.materialId())
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with ID: " + command.materialId()));

        if (!material.isActive()) {
            throw new BusinessException("Material is not active");
        }

        // Validate project if provided
        Project project = null;
        if (command.projectId() != null) {
            project = projectRepository.findById(command.projectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + command.projectId()));
        }

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Generate request number
        String requestNumber = generateRequestNumber();

        // Create material purchase request
        MaterialPurchaseRequest purchaseRequest = new MaterialPurchaseRequest();
        purchaseRequest.setProject(project);
        purchaseRequest.setMaterial(material);
        purchaseRequest.setRequestNumber(requestNumber);
        purchaseRequest.setDescription(command.description());
        purchaseRequest.setQuantity(command.quantity());
        purchaseRequest.setUom(command.uom() != null ? command.uom() : material.getUnit());
        purchaseRequest.setRequiredDate(command.requiredDate());
        purchaseRequest.setStatus(PurchaseRequestStatus.DRAFT);
        purchaseRequest.setCreatedBy(user);

        purchaseRequest = purchaseRequestRepository.save(purchaseRequest);
        return purchaseRequest.getId();
    }

    /**
     * Update an existing purchase request.
     *
     * @return the updated purchase request ID
     */
    public Long updatePurchaseRequest(Long id, UpdatePurchaseRequestCommand command) {
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + id));

        if (!purchaseRequest.canUpdate()) {
            throw new BusinessException("Cannot update purchase request in " + purchaseRequest.getStatus() + " status");
        }

        if (command.description() != null) {
            purchaseRequest.setDescription(command.description());
        }
        if (command.quantity() != null) {
            purchaseRequest.setQuantity(command.quantity());
        }
        if (command.uom() != null) {
            purchaseRequest.setUom(command.uom());
        }
        if (command.requiredDate() != null) {
            purchaseRequest.setRequiredDate(command.requiredDate());
        }

        purchaseRequest = purchaseRequestRepository.save(purchaseRequest);
        return purchaseRequest.getId();
    }

    /**
     * Send RFQ to vendors.
     * Creates RFQ items for each vendor using the aggregate method.
     *
     * @return the number of RFQs sent
     */
    public int sendRfq(Long purchaseRequestId, List<Long> vendorIds) {
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(purchaseRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + purchaseRequestId));

        if (!purchaseRequest.canSendRfq()) {
            throw new BusinessException("Cannot send RFQ for purchase request in " + purchaseRequest.getStatus() + " status");
        }

        // Validate vendors and create RFQ items using aggregate method
        for (Long vendorId : vendorIds) {
            Company vendor = companyRepository.findById(vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + vendorId));

            if (!vendor.hasRole(RoleType.VENDOR) && !vendor.hasRole(RoleType.OUTSOURCE)) {
                throw new BusinessException("Company with ID " + vendorId + " is not a vendor");
            }

            // Use aggregate method to add RFQ item (no vendorOfferingId for now)
            purchaseRequest.addRfqItem(vendorId, null);
        }

        // Transition status to RFQ_SENT
        purchaseRequest.sendRfq();
        purchaseRequestRepository.save(purchaseRequest);

        return vendorIds.size();
    }

    /**
     * Cancel a purchase request.
     */
    public void cancelPurchaseRequest(Long id) {
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
