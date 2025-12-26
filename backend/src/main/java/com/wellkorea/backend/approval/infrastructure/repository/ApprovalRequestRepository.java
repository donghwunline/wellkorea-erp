package com.wellkorea.backend.approval.infrastructure.repository;

import com.wellkorea.backend.approval.domain.ApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for ApprovalRequest entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code ApprovalMapper} (MyBatis) via {@code ApprovalQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update operations (inherited from JpaRepository)</li>
 *   <li>Eager loading for approval request modification</li>
 * </ul>
 */
@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {

    /**
     * Find approval request with level decisions eagerly loaded.
     * Used by CommandService to load entity for approve/reject operations.
     *
     * @param id Approval request ID
     * @return Optional containing the approval request with level decisions loaded
     */
    @Query("SELECT ar FROM ApprovalRequest ar LEFT JOIN FETCH ar.levelDecisions WHERE ar.id = :id")
    Optional<ApprovalRequest> findByIdWithLevelDecisions(@Param("id") Long id);
}
