package com.wellkorea.backend.approval.infrastructure.repository;

import com.wellkorea.backend.approval.domain.ApprovalRequest;
import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ApprovalRequest entity.
 */
@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {

    /**
     * Find approval request by entity type and entity ID.
     */
    Optional<ApprovalRequest> findByEntityTypeAndEntityId(EntityType entityType, Long entityId);

    /**
     * Find pending approvals for a specific approver at their current level.
     * This finds requests where the user is the expected approver at the current level.
     */
    @Query("SELECT ar FROM ApprovalRequest ar " +
            "JOIN ar.levelDecisions ld " +
            "WHERE ar.status = 'PENDING' " +
            "AND ld.levelOrder = ar.currentLevel " +
            "AND ld.expectedApprover.id = :userId " +
            "AND ld.decision = 'PENDING'")
    Page<ApprovalRequest> findPendingByApproverUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * Find all approvals with filters.
     */
    @Query("SELECT ar FROM ApprovalRequest ar " +
            "WHERE (:entityType IS NULL OR ar.entityType = :entityType) " +
            "AND (:status IS NULL OR ar.status = :status)")
    Page<ApprovalRequest> findAllWithFilters(
            @Param("entityType") EntityType entityType,
            @Param("status") ApprovalStatus status,
            Pageable pageable);

    /**
     * Find approvals by status.
     */
    Page<ApprovalRequest> findByStatus(ApprovalStatus status, Pageable pageable);

    /**
     * Find approvals submitted by a user.
     */
    Page<ApprovalRequest> findBySubmittedById(Long userId, Pageable pageable);

    /**
     * Count pending approvals for a user.
     */
    @Query("SELECT COUNT(ar) FROM ApprovalRequest ar " +
            "JOIN ar.levelDecisions ld " +
            "WHERE ar.status = 'PENDING' " +
            "AND ld.levelOrder = ar.currentLevel " +
            "AND ld.expectedApprover.id = :userId " +
            "AND ld.decision = 'PENDING'")
    long countPendingByApproverUserId(@Param("userId") Long userId);

    /**
     * Find approval request with level decisions eagerly loaded.
     */
    @Query("SELECT ar FROM ApprovalRequest ar LEFT JOIN FETCH ar.levelDecisions WHERE ar.id = :id")
    Optional<ApprovalRequest> findByIdWithLevelDecisions(@Param("id") Long id);

    /**
     * Find approvals by entity type and entity ID.
     */
    List<ApprovalRequest> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(EntityType entityType, Long entityId);
}
