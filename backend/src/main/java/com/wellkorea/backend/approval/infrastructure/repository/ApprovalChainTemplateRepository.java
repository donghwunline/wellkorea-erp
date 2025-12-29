package com.wellkorea.backend.approval.infrastructure.repository;

import com.wellkorea.backend.approval.domain.ApprovalChainTemplate;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for ApprovalChainTemplate entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code ApprovalMapper} (MyBatis) via {@code ApprovalQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update operations (inherited from JpaRepository)</li>
 *   <li>Eager loading for approval chain creation</li>
 * </ul>
 */
@Repository
public interface ApprovalChainTemplateRepository extends JpaRepository<ApprovalChainTemplate, Long> {

    /**
     * Find chain template by entity type with levels eagerly loaded.
     * Used by CommandService to create approval request with proper chain levels.
     *
     * @param entityType Entity type (e.g., QUOTATION)
     * @return Optional containing the active chain template with levels loaded
     */
    @Query("SELECT t FROM ApprovalChainTemplate t LEFT JOIN FETCH t.levels WHERE t.entityType = :entityType AND t.active = true")
    Optional<ApprovalChainTemplate> findByEntityTypeWithLevels(@Param("entityType") EntityType entityType);
}
