package com.wellkorea.backend.approval.infrastructure.repository;

import com.wellkorea.backend.approval.domain.ApprovalChainTemplate;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ApprovalChainTemplate entity.
 */
@Repository
public interface ApprovalChainTemplateRepository extends JpaRepository<ApprovalChainTemplate, Long> {

    /**
     * Find chain template by entity type.
     */
    Optional<ApprovalChainTemplate> findByEntityType(EntityType entityType);

    /**
     * Find active chain template by entity type.
     */
    Optional<ApprovalChainTemplate> findByEntityTypeAndActiveTrue(EntityType entityType);

    /**
     * Find all active chain templates.
     */
    List<ApprovalChainTemplate> findByActiveTrue();

    /**
     * Find chain template with levels eagerly loaded.
     */
    @Query("SELECT t FROM ApprovalChainTemplate t LEFT JOIN FETCH t.levels WHERE t.id = :id")
    Optional<ApprovalChainTemplate> findByIdWithLevels(@Param("id") Long id);

    /**
     * Find chain template by entity type with levels.
     */
    @Query("SELECT t FROM ApprovalChainTemplate t LEFT JOIN FETCH t.levels WHERE t.entityType = :entityType AND t.active = true")
    Optional<ApprovalChainTemplate> findByEntityTypeWithLevels(@Param("entityType") EntityType entityType);
}
