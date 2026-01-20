package com.wellkorea.backend.catalog.application;

import com.wellkorea.backend.catalog.api.dto.query.MaterialDetailView;
import com.wellkorea.backend.catalog.api.dto.query.MaterialSummaryView;
import com.wellkorea.backend.catalog.api.dto.query.VendorMaterialOfferingView;
import com.wellkorea.backend.catalog.infrastructure.mapper.MaterialMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Query service for material read operations.
 */
@Service
@Transactional(readOnly = true)
public class MaterialQueryService {

    private final MaterialMapper materialMapper;

    public MaterialQueryService(MaterialMapper materialMapper) {
        this.materialMapper = materialMapper;
    }

    /**
     * List materials with optional filters.
     *
     * @param categoryId Optional category filter
     * @param search     Optional search term
     * @param activeOnly Only active materials
     * @param pageable   Pagination
     * @return Page of materials
     */
    public Page<MaterialSummaryView> listMaterials(Long categoryId,
                                                   String search,
                                                   boolean activeOnly,
                                                   Pageable pageable) {
        List<MaterialSummaryView> content = materialMapper.findWithFilters(
                categoryId,
                search,
                activeOnly,
                pageable.getPageSize(),
                pageable.getOffset()
        );
        long total = materialMapper.countWithFilters(categoryId, search, activeOnly);

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get all active materials (for dropdown).
     */
    public List<MaterialSummaryView> getAllActiveMaterials() {
        return materialMapper.findAllActive();
    }

    /**
     * Get material detail by ID.
     */
    public MaterialDetailView getMaterialDetail(Long id) {
        return materialMapper.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with ID: " + id));
    }

    // ========== VENDOR MATERIAL OFFERING QUERIES ==========

    /**
     * Get current vendor offerings for a material.
     * Only includes offerings within their effective date range.
     *
     * @param materialId Material ID
     * @return List of current vendor offerings
     */
    public List<VendorMaterialOfferingView> getCurrentOfferingsForMaterial(Long materialId) {
        return materialMapper.findCurrentOfferingsByMaterialId(materialId, LocalDate.now());
    }

    /**
     * Get vendor offerings for a material (paginated).
     *
     * @param materialId Material ID
     * @param pageable   Pagination info
     * @return Page of vendor offerings
     */
    public Page<VendorMaterialOfferingView> getOfferingsForMaterial(Long materialId, Pageable pageable) {
        List<VendorMaterialOfferingView> content = materialMapper.findOfferingsByMaterialId(
                materialId,
                pageable.getPageSize(),
                pageable.getOffset()
        );
        long total = materialMapper.countOfferingsByMaterialId(materialId);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get vendor offering by ID.
     */
    public VendorMaterialOfferingView getOfferingById(Long id) {
        return materialMapper.findOfferingById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor material offering not found with ID: " + id));
    }
}
