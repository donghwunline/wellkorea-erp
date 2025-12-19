package com.wellkorea.backend.approval.infrastructure.repository;

import com.wellkorea.backend.approval.domain.ApprovalComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ApprovalComment entity.
 */
@Repository
public interface ApprovalCommentRepository extends JpaRepository<ApprovalComment, Long> {

    /**
     * Find comments by approval request ID ordered by creation time.
     */
    List<ApprovalComment> findByApprovalRequestIdOrderByCreatedAtAsc(Long approvalRequestId);

    /**
     * Find the rejection reason for an approval request.
     */
    Optional<ApprovalComment> findByApprovalRequestIdAndRejectionReasonTrue(Long approvalRequestId);

    /**
     * Find comments by commenter ID.
     */
    List<ApprovalComment> findByCommenterIdOrderByCreatedAtDesc(Long commenterId);
}
