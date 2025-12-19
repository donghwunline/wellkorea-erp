package com.wellkorea.backend.approval.infrastructure.repository;

import com.wellkorea.backend.approval.domain.ApprovalLevelDecision;
import com.wellkorea.backend.approval.domain.DecisionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ApprovalLevelDecision entity.
 */
@Repository
public interface ApprovalLevelDecisionRepository extends JpaRepository<ApprovalLevelDecision, Long> {

    /**
     * Find decisions by approval request ID ordered by level.
     */
    List<ApprovalLevelDecision> findByApprovalRequestIdOrderByLevelOrderAsc(Long approvalRequestId);

    /**
     * Find decision for a specific level.
     */
    Optional<ApprovalLevelDecision> findByApprovalRequestIdAndLevelOrder(Long approvalRequestId, Integer levelOrder);

    /**
     * Find pending decisions for a user (across all their levels).
     */
    @Query("SELECT d FROM ApprovalLevelDecision d " +
            "WHERE d.expectedApprover.id = :userId " +
            "AND d.decision = 'PENDING' " +
            "AND d.approvalRequest.status = 'PENDING' " +
            "AND d.levelOrder = d.approvalRequest.currentLevel")
    List<ApprovalLevelDecision> findPendingDecisionsByUserId(@Param("userId") Long userId);

    /**
     * Count pending decisions for a user.
     */
    @Query("SELECT COUNT(d) FROM ApprovalLevelDecision d " +
            "WHERE d.expectedApprover.id = :userId " +
            "AND d.decision = 'PENDING' " +
            "AND d.approvalRequest.status = 'PENDING' " +
            "AND d.levelOrder = d.approvalRequest.currentLevel")
    long countPendingDecisionsByUserId(@Param("userId") Long userId);

    /**
     * Find decisions by status.
     */
    List<ApprovalLevelDecision> findByDecision(DecisionStatus decision);
}
