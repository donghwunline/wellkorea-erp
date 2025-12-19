package com.wellkorea.backend.approval.infrastructure.repository;

import com.wellkorea.backend.approval.domain.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ApprovalHistory entity.
 */
@Repository
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, Long> {

    /**
     * Find history by approval request ID ordered by creation time.
     */
    List<ApprovalHistory> findByApprovalRequestIdOrderByCreatedAtAsc(Long approvalRequestId);

    /**
     * Find history by actor (user) ID.
     */
    List<ApprovalHistory> findByActorIdOrderByCreatedAtDesc(Long actorId);
}
