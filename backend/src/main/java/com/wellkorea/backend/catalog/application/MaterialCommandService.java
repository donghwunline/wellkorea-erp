package com.wellkorea.backend.catalog.application;

import com.wellkorea.backend.catalog.domain.Material;
import com.wellkorea.backend.catalog.domain.MaterialCategory;
import com.wellkorea.backend.catalog.domain.VendorMaterialOffering;
import com.wellkorea.backend.catalog.infrastructure.persistence.MaterialCategoryRepository;
import com.wellkorea.backend.catalog.infrastructure.persistence.MaterialRepository;
import com.wellkorea.backend.catalog.infrastructure.persistence.VendorMaterialOfferingRepository;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.vo.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command service for material and vendor material offering write operations.
 * Part of CQRS pattern - handles all create/update/delete operations.
 * Returns only entity IDs - clients should fetch fresh data via query service.
 */
@Service
@Transactional
public class MaterialCommandService {

    private final MaterialRepository materialRepository;
    private final MaterialCategoryRepository categoryRepository;
    private final CompanyRepository companyRepository;
    private final VendorMaterialOfferingRepository vendorMaterialOfferingRepository;

    public MaterialCommandService(MaterialRepository materialRepository,
                                  MaterialCategoryRepository categoryRepository,
                                  CompanyRepository companyRepository,
                                  VendorMaterialOfferingRepository vendorMaterialOfferingRepository) {
        this.materialRepository = materialRepository;
        this.categoryRepository = categoryRepository;
        this.companyRepository = companyRepository;
        this.vendorMaterialOfferingRepository = vendorMaterialOfferingRepository;
    }

    // ========== MATERIAL COMMANDS ==========

    /**
     * Create a new material.
     *
     * @param command Create command
     * @return Created material ID
     */
    public Long createMaterial(CreateMaterialCommand command) {
        // Validate unique SKU
        if (materialRepository.existsBySku(command.sku())) {
            throw new BusinessException("Material with SKU '" + command.sku() + "' already exists");
        }

        // Validate category
        MaterialCategory category = categoryRepository.findById(command.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Material category not found with ID: " + command.categoryId()));

        if (!category.isActive()) {
            throw new BusinessException("Material category is not active");
        }

        // Validate preferred vendor if provided
        Company preferredVendor = null;
        if (command.preferredVendorId() != null) {
            preferredVendor = companyRepository.findById(command.preferredVendorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found with ID: " + command.preferredVendorId()));
        }

        // Create material
        Material material = new Material();
        material.setSku(command.sku());
        material.setName(command.name());
        material.setDescription(command.description());
        material.setCategory(category);
        material.setUnit(command.unit());
        material.setStandardPrice(command.standardPrice());
        material.setPreferredVendor(preferredVendor);

        material = materialRepository.save(material);
        return material.getId();
    }

    /**
     * Update an existing material.
     *
     * @param id      Material ID
     * @param command Update command
     * @return Updated material ID
     */
    public Long updateMaterial(Long id, UpdateMaterialCommand command) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with ID: " + id));

        if (command.name() != null) {
            material.setName(command.name());
        }
        if (command.description() != null) {
            material.setDescription(command.description());
        }
        if (command.categoryId() != null) {
            MaterialCategory category = categoryRepository.findById(command.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Material category not found with ID: " + command.categoryId()));
            material.setCategory(category);
        }
        if (command.unit() != null) {
            material.setUnit(command.unit());
        }
        if (command.standardPrice() != null) {
            material.setStandardPrice(command.standardPrice());
        }
        if (command.preferredVendorId() != null) {
            Company preferredVendor = companyRepository.findById(command.preferredVendorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found with ID: " + command.preferredVendorId()));
            material.setPreferredVendor(preferredVendor);
        }
        if (command.active() != null) {
            material.setActive(command.active());
        }

        material = materialRepository.save(material);
        return material.getId();
    }

    /**
     * Deactivate a material (soft delete).
     *
     * @param id Material ID
     */
    public void deactivateMaterial(Long id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with ID: " + id));

        material.deactivate();
        materialRepository.save(material);
    }

    // ========== VENDOR MATERIAL OFFERING COMMANDS ==========

    /**
     * Create a new vendor material offering.
     *
     * @param command The creation command
     * @return ID of the created offering
     * @throws ResourceNotFoundException if vendor or material not found
     * @throws BusinessException         if vendor doesn't have VENDOR role or duplicate offering exists
     */
    public Long createVendorMaterialOffering(CreateVendorMaterialOfferingCommand command) {
        // Validate vendor exists and has proper role
        Company vendor = companyRepository.findById(command.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Company", command.vendorId()));

        boolean hasVendorRole = vendor.getRoles().stream()
                .anyMatch(role -> role.getRoleType() == RoleType.VENDOR);
        if (!hasVendorRole) {
            throw new BusinessException("Company must have VENDOR role to create vendor material offering");
        }

        // Validate material exists
        Material material = materialRepository.findById(command.materialId())
                .orElseThrow(() -> new ResourceNotFoundException("Material", command.materialId()));

        // Validate no duplicate offering
        if (vendorMaterialOfferingRepository.existsByVendorAndMaterialAndEffectiveFrom(
                command.vendorId(), command.materialId(), command.effectiveFrom())) {
            throw new BusinessException("Vendor material offering already exists for this vendor, material, and effective date");
        }

        // Validate date range
        if (command.effectiveTo().isBefore(command.effectiveFrom())) {
            throw new BusinessException("Effective end date must be on or after start date");
        }

        VendorMaterialOffering offering = new VendorMaterialOffering();
        offering.setVendor(vendor);
        offering.setMaterial(material);
        offering.setVendorMaterialCode(command.vendorMaterialCode());
        offering.setVendorMaterialName(command.vendorMaterialName());
        offering.setUnitPrice(command.unitPrice());
        offering.setCurrency(command.currency());
        offering.setLeadTimeDays(command.leadTimeDays());
        offering.setMinOrderQuantity(command.minOrderQuantity());
        offering.setEffectiveFrom(command.effectiveFrom());
        offering.setEffectiveTo(command.effectiveTo());
        offering.setPreferred(command.isPreferred());
        offering.setNotes(command.notes());

        // If this is set as preferred, clear other preferred offerings for this material
        if (command.isPreferred()) {
            vendorMaterialOfferingRepository.clearPreferredForMaterial(command.materialId());
        }

        return vendorMaterialOfferingRepository.save(offering).getId();
    }

    /**
     * Update a vendor material offering.
     *
     * @param offeringId The offering ID
     * @param command    The update command
     * @return ID of the updated offering
     * @throws ResourceNotFoundException if offering not found
     * @throws BusinessException         if update would create duplicate
     */
    public Long updateVendorMaterialOffering(Long offeringId, UpdateVendorMaterialOfferingCommand command) {
        VendorMaterialOffering offering = vendorMaterialOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("VendorMaterialOffering", offeringId));

        // Validate date range if changing
        if (command.effectiveFrom() != null && command.effectiveTo() != null
                && command.effectiveTo().isBefore(command.effectiveFrom())) {
            throw new BusinessException("Effective end date must be on or after start date");
        }

        // Check for duplicate if changing effective date
        if (command.effectiveFrom() != null && !command.effectiveFrom().equals(offering.getEffectiveFrom())) {
            if (vendorMaterialOfferingRepository.existsByVendorAndMaterialAndEffectiveFromAndIdNot(
                    offering.getVendorId(), offering.getMaterialId(), command.effectiveFrom(), offeringId)) {
                throw new BusinessException("Vendor material offering already exists for this vendor, material, and effective date");
            }
            offering.setEffectiveFrom(command.effectiveFrom());
        }

        if (command.vendorMaterialCode() != null) {
            offering.setVendorMaterialCode(command.vendorMaterialCode());
        }
        if (command.vendorMaterialName() != null) {
            offering.setVendorMaterialName(command.vendorMaterialName());
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
            // If setting as preferred, clear other preferred offerings for this material
            if (command.isPreferred() && !offering.isPreferred()) {
                vendorMaterialOfferingRepository.clearPreferredForMaterial(offering.getMaterialId());
            }
            offering.setPreferred(command.isPreferred());
        }
        if (command.notes() != null) {
            offering.setNotes(command.notes());
        }

        return vendorMaterialOfferingRepository.save(offering).getId();
    }

    /**
     * Delete a vendor material offering (hard delete).
     *
     * @param offeringId The offering ID
     * @throws ResourceNotFoundException if offering not found
     */
    public void deleteVendorMaterialOffering(Long offeringId) {
        VendorMaterialOffering offering = vendorMaterialOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("VendorMaterialOffering", offeringId));

        vendorMaterialOfferingRepository.delete(offering);
    }

    /**
     * Set a vendor material offering as preferred.
     * Clears the preferred flag on all other offerings for the same material.
     *
     * @param offeringId The offering ID to set as preferred
     * @return ID of the updated offering
     * @throws ResourceNotFoundException if offering not found
     */
    public Long setPreferredVendorOffering(Long offeringId) {
        VendorMaterialOffering offering = vendorMaterialOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("VendorMaterialOffering", offeringId));

        // Clear all other preferred offerings for this material
        vendorMaterialOfferingRepository.clearPreferredForMaterial(offering.getMaterialId());

        // Set this offering as preferred
        offering.setPreferred(true);
        return vendorMaterialOfferingRepository.save(offering).getId();
    }
}
