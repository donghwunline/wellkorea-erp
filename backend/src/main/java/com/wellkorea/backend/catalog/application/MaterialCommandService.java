package com.wellkorea.backend.catalog.application;

import com.wellkorea.backend.catalog.domain.Material;
import com.wellkorea.backend.catalog.domain.MaterialCategory;
import com.wellkorea.backend.catalog.infrastructure.persistence.MaterialCategoryRepository;
import com.wellkorea.backend.catalog.infrastructure.persistence.MaterialRepository;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command service for material write operations.
 */
@Service
@Transactional
public class MaterialCommandService {

    private final MaterialRepository materialRepository;
    private final MaterialCategoryRepository categoryRepository;
    private final CompanyRepository companyRepository;

    public MaterialCommandService(MaterialRepository materialRepository,
                                   MaterialCategoryRepository categoryRepository,
                                   CompanyRepository companyRepository) {
        this.materialRepository = materialRepository;
        this.categoryRepository = categoryRepository;
        this.companyRepository = companyRepository;
    }

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
}
