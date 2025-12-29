package com.wellkorea.backend.approval.infrastructure.repository;

import com.wellkorea.backend.approval.domain.ApprovalComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for ApprovalComment entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code ApprovalMapper} (MyBatis) via {@code ApprovalQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save operations for recording comments on approvals (inherited from JpaRepository)</li>
 * </ul>
 */
@Repository
public interface ApprovalCommentRepository extends JpaRepository<ApprovalComment, Long> {
    // All read operations are handled by ApprovalMapper
}
