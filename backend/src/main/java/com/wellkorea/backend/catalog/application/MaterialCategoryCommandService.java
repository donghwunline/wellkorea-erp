package com.wellkorea.backend.catalog.application;

import com.wellkorea.backend.catalog.domain.MaterialCategory;
import com.wellkorea.backend.catalog.infrastructure.persistence.MaterialCategoryRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command service for material category write operations.
 */
@Service
@Transactional
public class MaterialCategoryCommandService {

    private final MaterialCategoryRepository categoryRepository;

    public MaterialCategoryCommandService(MaterialCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    /**
     * Create a new material category.
     *
     * @param command Create command
     * @return Created category ID
     */
    public Long createMaterialCategory(CreateMaterialCategoryCommand command) {
        // Validate unique name
        if (categoryRepository.existsByName(command.name())) {
            throw new BusinessException("Material category with name '" + command.name() + "' already exists");
        }

        MaterialCategory category = new MaterialCategory();
        category.setName(command.name());
        category.setDescription(command.description());

        category = categoryRepository.save(category);
        return category.getId();
    }

    /**
     * Update an existing material category.
     *
     * @param id      Category ID
     * @param command Update command
     * @return Updated category ID
     */
    public Long updateMaterialCategory(Long id, UpdateMaterialCategoryCommand command) {
        MaterialCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material category not found with ID: " + id));

        if (command.name() != null) {
            // Check for duplicate name (excluding current category)
            if (categoryRepository.existsByNameAndIdNot(command.name(), id)) {
                throw new BusinessException("Material category with name '" + command.name() + "' already exists");
            }
            category.setName(command.name());
        }
        if (command.description() != null) {
            category.setDescription(command.description());
        }
        if (command.active() != null) {
            category.setActive(command.active());
        }

        category = categoryRepository.save(category);
        return category.getId();
    }

    /**
     * Deactivate a material category (soft delete).
     *
     * @param id Category ID
     */
    public void deactivateMaterialCategory(Long id) {
        MaterialCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material category not found with ID: " + id));

        category.setActive(false);
        categoryRepository.save(category);
    }
}
