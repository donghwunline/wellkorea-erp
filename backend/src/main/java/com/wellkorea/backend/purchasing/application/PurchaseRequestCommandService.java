package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.catalog.domain.ServiceCategory;
import com.wellkorea.backend.catalog.infrastructure.persistence.ServiceCategoryRepository;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.purchasing.domain.PurchaseRequestStatus;
import com.wellkorea.backend.purchasing.domain.RfqItem;
import com.wellkorea.backend.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.purchasing.infrastructure.persistence.RfqItemRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

/**
 * Command service for purchase request write operations.
 */
@Service
@Transactional
public class PurchaseRequestCommandService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final RfqItemRepository rfqItemRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public PurchaseRequestCommandService(PurchaseRequestRepository purchaseRequestRepository,
                                         RfqItemRepository rfqItemRepository,
                                         ServiceCategoryRepository serviceCategoryRepository,
                                         ProjectRepository projectRepository,
                                         CompanyRepository companyRepository,
                                         UserRepository userRepository) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.rfqItemRepository = rfqItemRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.projectRepository = projectRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new purchase request.
     *
     * @return the created purchase request ID
     */
    public Long createPurchaseRequest(CreatePurchaseRequestCommand command, Long userId) {
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

        // Create purchase request
        PurchaseRequest purchaseRequest = new PurchaseRequest();
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
     *
     * @return the number of RFQs sent
     */
    public int sendRfq(Long purchaseRequestId, List<Long> vendorIds) {
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(purchaseRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + purchaseRequestId));

        if (!purchaseRequest.canSendRfq()) {
            throw new BusinessException("Cannot send RFQ for purchase request in " + purchaseRequest.getStatus() + " status");
        }

        // Create RFQ items for each vendor
        for (Long vendorId : vendorIds) {
            Company vendor = companyRepository.findById(vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + vendorId));

            if (!vendor.hasRole(RoleType.VENDOR) && !vendor.hasRole(RoleType.OUTSOURCE)) {
                throw new BusinessException("Company with ID " + vendorId + " is not a vendor");
            }

            RfqItem rfqItem = new RfqItem();
            rfqItem.setVendor(vendor);
            rfqItem.setSentAt(LocalDateTime.now());
            purchaseRequest.addRfqItem(rfqItem);
        }

        // Update status
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
