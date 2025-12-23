package com.wellkorea.backend.catalog.infrastructure.persistence;

import com.wellkorea.backend.catalog.domain.ServiceCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ServiceCategory entity.
 */
@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {

    /**
     * Find all active service categories.
     */
    List<ServiceCategory> findByActiveTrue();

    /**
     * Find active service categories with pagination.
     */
    Page<ServiceCategory> findByActiveTrue(Pageable pageable);

    /**
     * Find service category by name.
     */
    Optional<ServiceCategory> findByName(String name);

    /**
     * Check if service category exists by name.
     */
    boolean existsByName(String name);

    /**
     * Check if service category exists by name excluding a specific ID.
     */
    boolean existsByNameAndIdNot(String name, Long id);

    /**
     * Search service categories by name.
     */
    @Query("SELECT sc FROM ServiceCategory sc WHERE sc.active = true AND " +
            "LOWER(sc.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<ServiceCategory> searchByName(@Param("search") String search, Pageable pageable);
}
