package com.wellkorea.backend.catalog.application;

import com.wellkorea.backend.catalog.api.dto.query.ServiceCategoryDetailView;
import com.wellkorea.backend.catalog.api.dto.query.ServiceCategorySummaryView;
import com.wellkorea.backend.catalog.api.dto.query.VendorServiceOfferingView;
import com.wellkorea.backend.catalog.infrastructure.mapper.ServiceCategoryMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Query service for service category and vendor offering read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 *
 * <p>Uses MyBatis for all queries. Eliminates N+1 queries by using subquery COUNT
 * for vendorCount and explicit JOINs for vendor/category names.
 */
@Service
@Transactional(readOnly = true)
public class ServiceCategoryQueryService {

    private final ServiceCategoryMapper serviceCategoryMapper;

    public ServiceCategoryQueryService(ServiceCategoryMapper serviceCategoryMapper) {
        this.serviceCategoryMapper = serviceCategoryMapper;
    }

    // ========== SERVICE CATEGORY QUERIES ==========

    /**
     * Get service category detail by ID.
     *
     * @param categoryId The service category ID
     * @return Service category detail view
     * @throws ResourceNotFoundException if category not found
     */
    public ServiceCategoryDetailView getServiceCategoryDetail(Long categoryId) {
        return serviceCategoryMapper.findDetailById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceCategory", categoryId));
    }

    /**
     * List service categories with optional filters (paginated).
     *
     * @param search   Optional search term
     * @param isActive Optional active status filter (null for all, true for active, false for inactive)
     * @param pageable Pagination parameters
     * @return Page of service category summary views
     */
    public Page<ServiceCategorySummaryView> listServiceCategories(String search, Boolean isActive, Pageable pageable) {
        String searchTerm = (search == null || search.isBlank()) ? null : search.trim();
        List<ServiceCategorySummaryView> content = serviceCategoryMapper.findWithFilters(
                searchTerm, isActive, pageable.getPageSize(), pageable.getOffset());
        long total = serviceCategoryMapper.countWithFilters(searchTerm, isActive);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get all service categories (for dropdown).
     *
     * @return List of all active service categories
     */
    public List<ServiceCategorySummaryView> getAllServiceCategories() {
        return serviceCategoryMapper.findAllActive();
    }

    // ========== VENDOR OFFERING QUERIES ==========

    /**
     * Get vendor offerings for a service category.
     *
     * @param serviceCategoryId The service category ID
     * @param pageable          Pagination parameters
     * @return Page of vendor offering views
     */
    public Page<VendorServiceOfferingView> getOfferingsForServiceCategory(Long serviceCategoryId, Pageable pageable) {
        List<VendorServiceOfferingView> content = serviceCategoryMapper.findOfferingsByServiceCategoryId(serviceCategoryId, pageable.getPageSize(), pageable.getOffset());
        long total = serviceCategoryMapper.countOfferingsByServiceCategoryId(serviceCategoryId);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get current vendor offerings for a service category.
     * Only includes offerings within their effective date range.
     *
     * @param serviceCategoryId The service category ID
     * @return List of current vendor offering views
     */
    public List<VendorServiceOfferingView> getCurrentOfferingsForServiceCategory(Long serviceCategoryId) {
        return serviceCategoryMapper.findCurrentOfferingsByServiceCategoryId(serviceCategoryId, LocalDate.now());
    }

    /**
     * Get vendor offerings by vendor.
     *
     * @param vendorId The vendor ID
     * @param pageable Pagination parameters
     * @return Page of vendor offering views
     */
    public Page<VendorServiceOfferingView> getOfferingsForVendor(Long vendorId, Pageable pageable) {
        List<VendorServiceOfferingView> content = serviceCategoryMapper.findOfferingsByVendorId(vendorId, pageable.getPageSize(), pageable.getOffset());
        long total = serviceCategoryMapper.countOfferingsByVendorId(vendorId);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get vendor offering by ID.
     *
     * @param offeringId The offering ID
     * @return Vendor offering view
     * @throws ResourceNotFoundException if offering not found
     */
    public VendorServiceOfferingView getVendorOffering(Long offeringId) {
        return serviceCategoryMapper.findOfferingById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("VendorServiceOffering", offeringId));
    }
}
