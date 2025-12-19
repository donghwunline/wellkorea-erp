package com.wellkorea.backend.quotation.infrastructure.repository;

import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Quotation entity.
 */
@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {

    /**
     * Find quotations by project ID.
     */
    List<Quotation> findByProjectIdAndDeletedFalseOrderByVersionDesc(Long projectId);

    /**
     * Find the latest version for a project.
     */
    @Query("SELECT MAX(q.version) FROM Quotation q WHERE q.project.id = :projectId AND q.deleted = false")
    Optional<Integer> findLatestVersionByProjectId(@Param("projectId") Long projectId);

    /**
     * Find quotation by project ID and version.
     */
    Optional<Quotation> findByProjectIdAndVersionAndDeletedFalse(Long projectId, Integer version);

    /**
     * Find all quotations with filters.
     */
    @Query("SELECT q FROM Quotation q WHERE q.deleted = false " +
            "AND (:status IS NULL OR q.status = :status) " +
            "AND (:projectId IS NULL OR q.project.id = :projectId)")
    Page<Quotation> findAllWithFilters(
            @Param("status") QuotationStatus status,
            @Param("projectId") Long projectId,
            Pageable pageable);

    /**
     * Find quotations by status.
     */
    Page<Quotation> findByStatusAndDeletedFalse(QuotationStatus status, Pageable pageable);

    /**
     * Find quotations created by a user.
     */
    Page<Quotation> findByCreatedByIdAndDeletedFalse(Long userId, Pageable pageable);

    /**
     * Count quotations by status.
     */
    long countByStatusAndDeletedFalse(QuotationStatus status);

    /**
     * Find quotation with line items eagerly loaded.
     */
    @Query("SELECT q FROM Quotation q LEFT JOIN FETCH q.lineItems WHERE q.id = :id AND q.deleted = false")
    Optional<Quotation> findByIdWithLineItems(@Param("id") Long id);
}
