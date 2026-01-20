package com.wellkorea.backend.catalog.infrastructure.persistence;

import com.wellkorea.backend.catalog.domain.VendorMaterialOffering;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

/**
 * Repository for VendorMaterialOffering entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code MaterialMapper} (MyBatis) via {@code MaterialQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update/delete operations (inherited from JpaRepository)</li>
 *   <li>Duplicate offering validation</li>
 *   <li>Preferred vendor management</li>
 * </ul>
 */
@Repository
public interface VendorMaterialOfferingRepository extends JpaRepository<VendorMaterialOffering, Long> {

    /**
     * Check for duplicate offering (same vendor, material, effective date).
     * Used by CommandService for duplicate validation on create.
     *
     * @param vendorId      Vendor ID
     * @param materialId    Material ID
     * @param effectiveFrom Effective start date
     * @return true if duplicate offering exists
     */
    @Query("SELECT COUNT(vmo) > 0 FROM VendorMaterialOffering vmo " +
            "WHERE vmo.vendor.id = :vendorId " +
            "AND vmo.material.id = :materialId " +
            "AND vmo.effectiveFrom = :effectiveFrom")
    boolean existsByVendorAndMaterialAndEffectiveFrom(
            @Param("vendorId") Long vendorId,
            @Param("materialId") Long materialId,
            @Param("effectiveFrom") LocalDate effectiveFrom);

    /**
     * Check for duplicate offering excluding a specific ID.
     * Used by CommandService for duplicate validation on update.
     *
     * @param vendorId      Vendor ID
     * @param materialId    Material ID
     * @param effectiveFrom Effective start date
     * @param id            Offering ID to exclude
     * @return true if duplicate offering exists for another record
     */
    @Query("SELECT COUNT(vmo) > 0 FROM VendorMaterialOffering vmo " +
            "WHERE vmo.vendor.id = :vendorId " +
            "AND vmo.material.id = :materialId " +
            "AND vmo.effectiveFrom = :effectiveFrom " +
            "AND vmo.id != :id")
    boolean existsByVendorAndMaterialAndEffectiveFromAndIdNot(
            @Param("vendorId") Long vendorId,
            @Param("materialId") Long materialId,
            @Param("effectiveFrom") LocalDate effectiveFrom,
            @Param("id") Long id);

    /**
     * Clear preferred flag for all offerings of a material.
     * Used when setting a new preferred vendor.
     *
     * @param materialId Material ID
     */
    @Modifying
    @Query("UPDATE VendorMaterialOffering vmo SET vmo.preferred = false WHERE vmo.material.id = :materialId")
    void clearPreferredForMaterial(@Param("materialId") Long materialId);
}
