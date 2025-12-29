package com.wellkorea.backend.catalog.application;

import com.wellkorea.backend.catalog.domain.ServiceCategory;
import com.wellkorea.backend.catalog.domain.VendorServiceOffering;
import com.wellkorea.backend.catalog.infrastructure.persistence.ServiceCategoryRepository;
import com.wellkorea.backend.catalog.infrastructure.persistence.VendorServiceOfferingRepository;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command service for service category and vendor offering write operations.
 * Part of CQRS pattern - handles all create/update/delete operations.
 * Returns only entity IDs - clients should fetch fresh data via query service.
 */
@Service
@Transactional
public class ServiceCategoryCommandService {

    private final ServiceCategoryRepository serviceCategoryRepository;
    private final VendorServiceOfferingRepository vendorOfferingRepository;
    private final CompanyRepository companyRepository;

    public ServiceCategoryCommandService(ServiceCategoryRepository serviceCategoryRepository,
                                         VendorServiceOfferingRepository vendorOfferingRepository,
                                         CompanyRepository companyRepository) {
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.vendorOfferingRepository = vendorOfferingRepository;
        this.companyRepository = companyRepository;
    }

    // ========== SERVICE CATEGORY COMMANDS ==========

    /**
     * Create a new service category.
     *
     * @param command The creation command
     * @return ID of the created service category
     * @throws BusinessException if name is duplicate
     */
    public Long createServiceCategory(CreateServiceCategoryCommand command) {
        // Validate unique name
        if (serviceCategoryRepository.existsByName(command.name())) {
            throw new BusinessException("Service category with name '" + command.name() + "' already exists");
        }

        ServiceCategory category = new ServiceCategory();
        category.setName(command.name());
        category.setDescription(command.description());
        category.setActive(true);

        return serviceCategoryRepository.save(category).getId();
    }

    /**
     * Update a service category.
     *
     * @param categoryId The service category ID
     * @param command    The update command
     * @return ID of the updated service category
     * @throws ResourceNotFoundException if category not found
     * @throws BusinessException         if new name is duplicate
     */
    public Long updateServiceCategory(Long categoryId, UpdateServiceCategoryCommand command) {
        ServiceCategory category = serviceCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceCategory", categoryId));

        // Validate unique name if changing
        if (command.name() != null && !command.name().equals(category.getName())) {
            if (serviceCategoryRepository.existsByNameAndIdNot(command.name(), categoryId)) {
                throw new BusinessException("Service category with name '" + command.name() + "' already exists");
            }
            category.setName(command.name());
        }

        if (command.description() != null) {
            category.setDescription(command.description());
        }
        if (command.isActive() != null) {
            category.setActive(command.isActive());
        }

        return serviceCategoryRepository.save(category).getId();
    }

    /**
     * Deactivate (soft delete) a service category.
     *
     * @param categoryId The service category ID
     * @throws ResourceNotFoundException if category not found
     */
    public void deactivateServiceCategory(Long categoryId) {
        ServiceCategory category = serviceCategoryRepository.findById(categoryId)
                .filter(ServiceCategory::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceCategory", categoryId));

        category.setActive(false);
        serviceCategoryRepository.save(category);
    }

    // ========== VENDOR OFFERING COMMANDS ==========

    /**
     * Create a new vendor service offering.
     *
     * @param command The creation command
     * @return ID of the created offering
     * @throws ResourceNotFoundException if vendor or service category not found
     * @throws BusinessException         if vendor doesn't have VENDOR/OUTSOURCE role or duplicate offering exists
     */
    public Long createVendorOffering(CreateVendorOfferingCommand command) {
        // Validate vendor exists and has proper role
        Company vendor = companyRepository.findById(command.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Company", command.vendorId()));

        boolean hasVendorRole = vendor.getRoles().stream()
                .anyMatch(role -> role.getRoleType() == RoleType.VENDOR || role.getRoleType() == RoleType.OUTSOURCE);
        if (!hasVendorRole) {
            throw new BusinessException("Company must have VENDOR or OUTSOURCE role to create vendor offering");
        }

        // Validate service category exists
        ServiceCategory serviceCategory = serviceCategoryRepository.findById(command.serviceCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("ServiceCategory", command.serviceCategoryId()));

        // Validate no duplicate offering
        if (command.effectiveFrom() != null && vendorOfferingRepository.existsByVendorAndServiceAndEffectiveFrom(
                command.vendorId(), command.serviceCategoryId(), command.effectiveFrom())) {
            throw new BusinessException("Vendor offering already exists for this vendor, service, and effective date");
        }

        // Validate date range
        if (command.effectiveFrom() != null && command.effectiveTo() != null
                && command.effectiveTo().isBefore(command.effectiveFrom())) {
            throw new BusinessException("Effective end date must be on or after start date");
        }

        VendorServiceOffering offering = new VendorServiceOffering();
        offering.setVendor(vendor);
        offering.setServiceCategory(serviceCategory);
        offering.setVendorServiceCode(command.vendorServiceCode());
        offering.setVendorServiceName(command.vendorServiceName());
        offering.setUnitPrice(command.unitPrice());
        offering.setCurrency(command.currency());
        offering.setLeadTimeDays(command.leadTimeDays());
        offering.setMinOrderQuantity(command.minOrderQuantity());
        offering.setEffectiveFrom(command.effectiveFrom());
        offering.setEffectiveTo(command.effectiveTo());
        offering.setPreferred(command.isPreferred());
        offering.setNotes(command.notes());

        return vendorOfferingRepository.save(offering).getId();
    }

    /**
     * Update a vendor service offering.
     *
     * @param offeringId The offering ID
     * @param command    The update command
     * @return ID of the updated offering
     * @throws ResourceNotFoundException if offering not found
     * @throws BusinessException         if update would create duplicate
     */
    public Long updateVendorOffering(Long offeringId, UpdateVendorOfferingCommand command) {
        VendorServiceOffering offering = vendorOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("VendorServiceOffering", offeringId));

        // Validate date range if changing
        if (command.effectiveFrom() != null && command.effectiveTo() != null
                && command.effectiveTo().isBefore(command.effectiveFrom())) {
            throw new BusinessException("Effective end date must be on or after start date");
        }

        // Check for duplicate if changing effective date
        if (command.effectiveFrom() != null && !command.effectiveFrom().equals(offering.getEffectiveFrom())) {
            if (vendorOfferingRepository.existsByVendorAndServiceAndEffectiveFromAndIdNot(
                    offering.getVendorId(), offering.getServiceCategoryId(), command.effectiveFrom(), offeringId)) {
                throw new BusinessException("Vendor offering already exists for this vendor, service, and effective date");
            }
            offering.setEffectiveFrom(command.effectiveFrom());
        }

        if (command.vendorServiceCode() != null) {
            offering.setVendorServiceCode(command.vendorServiceCode());
        }
        if (command.vendorServiceName() != null) {
            offering.setVendorServiceName(command.vendorServiceName());
        }
        if (command.unitPrice() != null) {
            offering.setUnitPrice(command.unitPrice());
        }
        if (command.currency() != null) {
            offering.setCurrency(command.currency());
        }
        if (command.leadTimeDays() != null) {
            offering.setLeadTimeDays(command.leadTimeDays());
        }
        if (command.minOrderQuantity() != null) {
            offering.setMinOrderQuantity(command.minOrderQuantity());
        }
        if (command.effectiveTo() != null) {
            offering.setEffectiveTo(command.effectiveTo());
        }
        if (command.isPreferred() != null) {
            offering.setPreferred(command.isPreferred());
        }
        if (command.notes() != null) {
            offering.setNotes(command.notes());
        }

        return vendorOfferingRepository.save(offering).getId();
    }

    /**
     * Delete a vendor service offering.
     *
     * @param offeringId The offering ID
     * @throws ResourceNotFoundException if offering not found
     */
    public void deleteVendorOffering(Long offeringId) {
        VendorServiceOffering offering = vendorOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("VendorServiceOffering", offeringId));

        vendorOfferingRepository.delete(offering);
    }
}
