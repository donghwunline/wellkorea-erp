package com.wellkorea.backend.production.infrastructure.persistence;

import com.wellkorea.backend.production.domain.WorkProgressStepTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repository for WorkProgressStepTemplate entities.
 */
public interface WorkProgressStepTemplateRepository extends JpaRepository<WorkProgressStepTemplate, Long> {

    /**
     * Find all step templates for a product type, ordered by step number.
     */
    @Query("SELECT t FROM WorkProgressStepTemplate t WHERE t.productType.id = :productTypeId ORDER BY t.stepNumber")
    List<WorkProgressStepTemplate> findByProductTypeIdOrderByStepNumber(@Param("productTypeId") Long productTypeId);

    /**
     * Check if templates exist for a product type.
     */
    boolean existsByProductTypeId(Long productTypeId);
}
