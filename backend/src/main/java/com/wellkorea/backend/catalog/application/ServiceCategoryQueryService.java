package com.wellkorea.backend.catalog.application;

import com.wellkorea.backend.catalog.api.dto.query.ServiceCategoryDetailView;
import com.wellkorea.backend.catalog.api.dto.query.ServiceCategorySummaryView;
import com.wellkorea.backend.catalog.api.dto.query.VendorServiceOfferingView;
import com.wellkorea.backend.catalog.domain.ServiceCategory;
import com.wellkorea.backend.catalog.domain.VendorServiceOffering;
import com.wellkorea.backend.catalog.infrastructure.persistence.ServiceCategoryRepository;
import com.wellkorea.backend.catalog.infrastructure.persistence.VendorServiceOfferingRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Query service for service category and vendor offering read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 */
@Service
@Transactional(readOnly = true)
public class ServiceCategoryQueryService {

    private final ServiceCategoryRepository serviceCategoryRepository;
    private final VendorServiceOfferingRepository vendorOfferingRepository;

    public ServiceCategoryQueryService(
            ServiceCategoryRepository serviceCategoryRepository,
            VendorServiceOfferingRepository vendorOfferingRepository) {
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.vendorOfferingRepository = vendorOfferingRepository;
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
        ServiceCategory category = serviceCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceCategory", categoryId));
        int vendorCount = (int) vendorOfferingRepository.countByServiceCategoryId(categoryId);
        return ServiceCategoryDetailView.from(category, vendorCount);
    }

    /**
     * List all active service categories (paginated).
     *
     * @param pageable Pagination parameters
     * @return Page of service category summary views
     */
    public Page<ServiceCategorySummaryView> listServiceCategories(Pageable pageable) {
        Page<ServiceCategory> categories = serviceCategoryRepository.findByActiveTrue(pageable);
        return categories.map(cat -> {
            int vendorCount = (int) vendorOfferingRepository.countByServiceCategoryId(cat.getId());
            return ServiceCategorySummaryView.from(cat, vendorCount);
        });
    }

    /**
     * Search service categories by name.
     *
     * @param search   Search term
     * @param pageable Pagination parameters
     * @return Page of matching service category summary views
     */
    public Page<ServiceCategorySummaryView> searchServiceCategories(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return listServiceCategories(pageable);
        }
        Page<ServiceCategory> categories = serviceCategoryRepository.searchByName(search, pageable);
        return categories.map(cat -> {
            int vendorCount = (int) vendorOfferingRepository.countByServiceCategoryId(cat.getId());
            return ServiceCategorySummaryView.from(cat, vendorCount);
        });
    }

    /**
     * Get all service categories (for dropdown).
     *
     * @return List of all active service categories
     */
    public List<ServiceCategorySummaryView> getAllServiceCategories() {
        List<ServiceCategory> categories = serviceCategoryRepository.findByActiveTrue();
        return categories.stream()
                .map(cat -> {
                    int vendorCount = (int) vendorOfferingRepository.countByServiceCategoryId(cat.getId());
                    return ServiceCategorySummaryView.from(cat, vendorCount);
                })
                .toList();
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
        Page<VendorServiceOffering> offerings = vendorOfferingRepository.findByServiceCategoryId(serviceCategoryId, pageable);
        return offerings.map(VendorServiceOfferingView::from);
    }

    /**
     * Get current vendor offerings for a service category.
     * Only includes offerings within their effective date range.
     *
     * @param serviceCategoryId The service category ID
     * @return List of current vendor offering views
     */
    public List<VendorServiceOfferingView> getCurrentOfferingsForServiceCategory(Long serviceCategoryId) {
        List<VendorServiceOffering> offerings = vendorOfferingRepository
                .findCurrentOfferingsByServiceCategory(serviceCategoryId, LocalDate.now());
        return offerings.stream()
                .map(VendorServiceOfferingView::from)
                .toList();
    }

    /**
     * Get vendor offerings by vendor.
     *
     * @param vendorId The vendor ID
     * @param pageable Pagination parameters
     * @return Page of vendor offering views
     */
    public Page<VendorServiceOfferingView> getOfferingsForVendor(Long vendorId, Pageable pageable) {
        Page<VendorServiceOffering> offerings = vendorOfferingRepository.findByVendorId(vendorId, pageable);
        return offerings.map(VendorServiceOfferingView::from);
    }

    /**
     * Get vendor offering by ID.
     *
     * @param offeringId The offering ID
     * @return Vendor offering view
     * @throws ResourceNotFoundException if offering not found
     */
    public VendorServiceOfferingView getVendorOffering(Long offeringId) {
        VendorServiceOffering offering = vendorOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("VendorServiceOffering", offeringId));
        return VendorServiceOfferingView.from(offering);
    }
}
