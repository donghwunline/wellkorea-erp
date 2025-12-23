package com.wellkorea.backend.catalog.infrastructure.persistence;

import com.wellkorea.backend.catalog.domain.VendorServiceOffering;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository for VendorServiceOffering entity.
 */
@Repository
public interface VendorServiceOfferingRepository extends JpaRepository<VendorServiceOffering, Long> {

    /**
     * Find offerings by service category.
     */
    Page<VendorServiceOffering> findByServiceCategory_Id(Long serviceCategoryId, Pageable pageable);

    /**
     * Find offerings by vendor.
     */
    Page<VendorServiceOffering> findByVendor_Id(Long vendorId, Pageable pageable);

    /**
     * Find current offerings for a service category (within effective date range).
     */
    @Query("SELECT vso FROM VendorServiceOffering vso " +
            "WHERE vso.serviceCategory.id = :serviceCategoryId " +
            "AND (vso.effectiveFrom IS NULL OR vso.effectiveFrom <= :date) " +
            "AND (vso.effectiveTo IS NULL OR vso.effectiveTo >= :date) " +
            "ORDER BY vso.preferred DESC, vso.unitPrice ASC")
    List<VendorServiceOffering> findCurrentOfferingsByServiceCategory(
            @Param("serviceCategoryId") Long serviceCategoryId,
            @Param("date") LocalDate date);

    /**
     * Find preferred offerings for a service category.
     */
    @Query("SELECT vso FROM VendorServiceOffering vso " +
            "WHERE vso.serviceCategory.id = :serviceCategoryId " +
            "AND vso.preferred = true " +
            "AND (vso.effectiveFrom IS NULL OR vso.effectiveFrom <= :date) " +
            "AND (vso.effectiveTo IS NULL OR vso.effectiveTo >= :date)")
    List<VendorServiceOffering> findPreferredOfferingsByServiceCategory(
            @Param("serviceCategoryId") Long serviceCategoryId,
            @Param("date") LocalDate date);

    /**
     * Check for duplicate offering (same vendor, service, effective date).
     */
    @Query("SELECT COUNT(vso) > 0 FROM VendorServiceOffering vso " +
            "WHERE vso.vendor.id = :vendorId " +
            "AND vso.serviceCategory.id = :serviceCategoryId " +
            "AND vso.effectiveFrom = :effectiveFrom")
    boolean existsByVendorAndServiceAndEffectiveFrom(
            @Param("vendorId") Long vendorId,
            @Param("serviceCategoryId") Long serviceCategoryId,
            @Param("effectiveFrom") LocalDate effectiveFrom);

    /**
     * Check for duplicate offering excluding a specific ID.
     */
    @Query("SELECT COUNT(vso) > 0 FROM VendorServiceOffering vso " +
            "WHERE vso.vendor.id = :vendorId " +
            "AND vso.serviceCategory.id = :serviceCategoryId " +
            "AND vso.effectiveFrom = :effectiveFrom " +
            "AND vso.id != :id")
    boolean existsByVendorAndServiceAndEffectiveFromAndIdNot(
            @Param("vendorId") Long vendorId,
            @Param("serviceCategoryId") Long serviceCategoryId,
            @Param("effectiveFrom") LocalDate effectiveFrom,
            @Param("id") Long id);

    /**
     * Count offerings by service category.
     */
    long countByServiceCategory_Id(Long serviceCategoryId);
}
