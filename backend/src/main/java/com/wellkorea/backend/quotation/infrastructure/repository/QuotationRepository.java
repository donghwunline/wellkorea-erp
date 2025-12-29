package com.wellkorea.backend.quotation.infrastructure.repository;

import com.wellkorea.backend.quotation.domain.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Quotation entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code QuotationMapper} (MyBatis) via {@code QuotationQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update/delete operations (inherited from JpaRepository)</li>
 *   <li>Eager loading for entity modification</li>
 *   <li>Version number generation for new quotations</li>
 * </ul>
 */
@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {

    /**
     * Find the latest version for a project.
     * Used by CommandService to determine next version number.
     *
     * @param projectId Project ID
     * @return Optional containing the latest version number, or empty if no quotations exist
     */
    @Query("SELECT MAX(q.version) FROM Quotation q WHERE q.project.id = :projectId AND q.deleted = false")
    Optional<Integer> findLatestVersionByProjectId(@Param("projectId") Long projectId);

    /**
     * Find quotation with line items eagerly loaded.
     * Used by CommandService, PdfService, and EmailService to load entity for modification or rendering.
     * Also fetches project and createdBy to avoid N+1 queries.
     *
     * @param id Quotation ID
     * @return Optional containing the quotation with line items loaded
     */
    @Query("SELECT q FROM Quotation q " +
            "LEFT JOIN FETCH q.lineItems " +
            "LEFT JOIN FETCH q.project " +
            "LEFT JOIN FETCH q.createdBy " +
            "WHERE q.id = :id AND q.deleted = false")
    Optional<Quotation> findByIdWithLineItems(@Param("id") Long id);
}
