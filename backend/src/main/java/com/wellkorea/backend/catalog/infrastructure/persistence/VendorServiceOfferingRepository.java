package com.wellkorea.backend.catalog.infrastructure.persistence;

import com.wellkorea.backend.catalog.domain.VendorServiceOffering;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

/**
 * Repository for VendorServiceOffering entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code ServiceCategoryMapper} (MyBatis) via {@code ServiceCategoryQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update/delete operations (inherited from JpaRepository)</li>
 *   <li>Duplicate offering validation</li>
 * </ul>
 */
@Repository
public interface VendorServiceOfferingRepository extends JpaRepository<VendorServiceOffering, Long> {

    /**
     * Check for duplicate offering (same vendor, service, effective date).
     * Used by CommandService for duplicate validation on create.
     *
     * @param vendorId Vendor ID
     * @param serviceCategoryId Service category ID
     * @param effectiveFrom Effective start date
     * @return true if duplicate offering exists
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
     * Used by CommandService for duplicate validation on update.
     *
     * @param vendorId Vendor ID
     * @param serviceCategoryId Service category ID
     * @param effectiveFrom Effective start date
     * @param id Offering ID to exclude
     * @return true if duplicate offering exists for another record
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
}
