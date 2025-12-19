package com.wellkorea.backend.approval.infrastructure.repository;

import com.wellkorea.backend.approval.domain.ApprovalChainLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ApprovalChainLevel entity.
 */
@Repository
public interface ApprovalChainLevelRepository extends JpaRepository<ApprovalChainLevel, Long> {

    /**
     * Find levels by chain template ID ordered by level order.
     */
    List<ApprovalChainLevel> findByChainTemplateIdOrderByLevelOrderAsc(Long chainTemplateId);

    /**
     * Delete all levels for a chain template.
     */
    @Modifying
    @Query("DELETE FROM ApprovalChainLevel l WHERE l.chainTemplate.id = :chainTemplateId")
    void deleteAllByChainTemplateId(@Param("chainTemplateId") Long chainTemplateId);

    /**
     * Count levels for a chain template.
     */
    long countByChainTemplateId(Long chainTemplateId);
}
