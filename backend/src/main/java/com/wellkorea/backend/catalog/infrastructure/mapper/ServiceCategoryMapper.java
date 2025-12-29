package com.wellkorea.backend.catalog.infrastructure.mapper;

import com.wellkorea.backend.catalog.api.dto.query.ServiceCategoryDetailView;
import com.wellkorea.backend.catalog.api.dto.query.ServiceCategorySummaryView;
import com.wellkorea.backend.catalog.api.dto.query.VendorServiceOfferingView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for service category and vendor offering queries.
 * Eliminates N+1 queries by using subquery COUNT for vendorCount
 * and explicit JOINs for vendor/category names.
 */
@Mapper
public interface ServiceCategoryMapper {

    // ========== SERVICE CATEGORY QUERIES ==========

    /**
     * Find service category detail by ID with vendor count.
     */
    Optional<ServiceCategoryDetailView> findDetailById(@Param("id") Long id);

    /**
     * Find service categories with filters for pagination.
     */
    List<ServiceCategorySummaryView> findWithFilters(
            @Param("search") String search,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count service categories with filters for pagination.
     */
    long countWithFilters(@Param("search") String search);

    /**
     * Find all active service categories.
     */
    List<ServiceCategorySummaryView> findAllActive();

    // ========== VENDOR OFFERING QUERIES ==========

    /**
     * Find vendor offerings by service category for pagination.
     */
    List<VendorServiceOfferingView> findOfferingsByServiceCategoryId(
            @Param("serviceCategoryId") Long serviceCategoryId,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count vendor offerings by service category for pagination.
     */
    long countOfferingsByServiceCategoryId(@Param("serviceCategoryId") Long serviceCategoryId);

    /**
     * Find current vendor offerings by service category.
     */
    List<VendorServiceOfferingView> findCurrentOfferingsByServiceCategoryId(
            @Param("serviceCategoryId") Long serviceCategoryId,
            @Param("currentDate") LocalDate currentDate);

    /**
     * Find vendor offerings by vendor for pagination.
     */
    List<VendorServiceOfferingView> findOfferingsByVendorId(
            @Param("vendorId") Long vendorId,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count vendor offerings by vendor for pagination.
     */
    long countOfferingsByVendorId(@Param("vendorId") Long vendorId);

    /**
     * Find vendor offering by ID.
     */
    Optional<VendorServiceOfferingView> findOfferingById(@Param("id") Long id);
}
