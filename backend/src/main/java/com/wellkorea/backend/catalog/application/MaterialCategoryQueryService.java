package com.wellkorea.backend.catalog.application;

import com.wellkorea.backend.catalog.api.dto.query.MaterialCategorySummaryView;
import com.wellkorea.backend.catalog.infrastructure.mapper.MaterialCategoryMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for material category read operations.
 */
@Service
@Transactional(readOnly = true)
public class MaterialCategoryQueryService {

    private final MaterialCategoryMapper categoryMapper;

    public MaterialCategoryQueryService(MaterialCategoryMapper categoryMapper) {
        this.categoryMapper = categoryMapper;
    }

    /**
     * List material categories with optional search.
     */
    public Page<MaterialCategorySummaryView> listCategories(String search,
                                                             boolean activeOnly,
                                                             Pageable pageable) {
        List<MaterialCategorySummaryView> content = categoryMapper.findWithFilters(
                search,
                activeOnly,
                pageable.getPageSize(),
                pageable.getOffset()
        );
        long total = categoryMapper.countWithFilters(search, activeOnly);

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * List categories with pagination (default: active only).
     */
    public Page<MaterialCategorySummaryView> listCategories(Pageable pageable) {
        return listCategories(null, true, pageable);
    }

    /**
     * Search categories by name.
     */
    public Page<MaterialCategorySummaryView> searchCategories(String search, Pageable pageable) {
        return listCategories(search, true, pageable);
    }

    /**
     * Get all active categories (for dropdown).
     */
    public List<MaterialCategorySummaryView> getAllActiveCategories() {
        return categoryMapper.findAllActive();
    }

    /**
     * Get category by ID.
     */
    public MaterialCategorySummaryView getCategoryDetail(Long id) {
        return categoryMapper.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material category not found with ID: " + id));
    }
}
