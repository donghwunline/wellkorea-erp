package com.wellkorea.backend.approval.infrastructure.repository;

import com.wellkorea.backend.approval.domain.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for ApprovalHistory entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code ApprovalMapper} (MyBatis) via {@code ApprovalQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save operations for recording approval actions (inherited from JpaRepository)</li>
 * </ul>
 */
@Repository
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, Long> {
    // All read operations are handled by ApprovalMapper.findHistoryByRequestId()
}
