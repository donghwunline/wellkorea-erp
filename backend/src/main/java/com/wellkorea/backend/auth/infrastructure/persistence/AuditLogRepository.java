package com.wellkorea.backend.auth.infrastructure.persistence;

import com.wellkorea.backend.auth.domain.AuditLog;
import com.wellkorea.backend.auth.domain.vo.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository for AuditLog entity.
 * Read-only operations - AuditLog is immutable and protected by DB triggers.
 * <p>
 * Uses JpaSpecificationExecutor for dynamic filtering.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    /**
     * Find audit logs by entity type and ID.
     *
     * @param entityType Entity type (e.g., "Project", "User")
     * @param entityId   Entity ID
     * @return List of audit logs for the entity
     */
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);

    /**
     * Find audit logs by entity type.
     *
     * @param entityType Entity type
     * @param pageable   Pagination
     * @return Page of audit logs
     */
    Page<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);

    /**
     * Find audit logs by action type.
     *
     * @param action   Action type
     * @param pageable Pagination
     * @return Page of audit logs
     */
    Page<AuditLog> findByActionOrderByCreatedAtDesc(AuditAction action, Pageable pageable);

    /**
     * Find audit logs by user ID.
     *
     * @param userId   User ID
     * @param pageable Pagination
     * @return Page of audit logs
     */
    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find audit logs within a time range.
     *
     * @param start    Start timestamp (inclusive)
     * @param end      End timestamp (exclusive)
     * @param pageable Pagination
     * @return Page of audit logs
     */
    Page<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant start, Instant end, Pageable pageable);

    /**
     * Find audit logs with combined filters.
     *
     * @param entityType Entity type (optional - pass null to skip)
     * @param action     Action type (optional - pass null to skip)
     * @param userId     User ID (optional - pass null to skip)
     * @param pageable   Pagination
     * @return Page of audit logs matching all non-null criteria
     */
    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:entityType IS NULL OR a.entityType = :entityType)
            AND (:action IS NULL OR a.action = :action)
            AND (:userId IS NULL OR a.userId = :userId)
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> findWithFilters(
            @Param("entityType") String entityType,
            @Param("action") AuditAction action,
            @Param("userId") Long userId,
            Pageable pageable
    );

    /**
     * Find audit logs for a specific entity with combined filters.
     *
     * @param entityType Entity type
     * @param entityId   Entity ID
     * @param action     Action type (optional)
     * @param pageable   Pagination
     * @return Page of audit logs
     */
    @Query("""
            SELECT a FROM AuditLog a
            WHERE a.entityType = :entityType
            AND a.entityId = :entityId
            AND (:action IS NULL OR a.action = :action)
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> findByEntityWithFilters(
            @Param("entityType") String entityType,
            @Param("entityId") Long entityId,
            @Param("action") AuditAction action,
            Pageable pageable
    );
}
