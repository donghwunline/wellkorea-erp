package com.wellkorea.backend.auth.application;

import com.wellkorea.backend.auth.api.dto.AuditLogResponse;
import com.wellkorea.backend.auth.domain.AuditAction;
import com.wellkorea.backend.auth.domain.AuditLog;
import com.wellkorea.backend.auth.infrastructure.persistence.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service for audit log operations.
 * <p>
 * Audit logs are immutable - only create and read operations are supported.
 * The database has triggers preventing UPDATE and DELETE on audit_logs table.
 */
@Service
@Transactional(readOnly = true)
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    // ==================== Query Operations ====================

    /**
     * Get audit log by ID.
     *
     * @param id Audit log ID
     * @return AuditLogResponse if found
     */
    public Optional<AuditLogResponse> getById(Long id) {
        return auditLogRepository.findById(id).map(this::toResponse);
    }

    /**
     * Get all audit logs with optional filters.
     *
     * @param entityType Filter by entity type (optional)
     * @param action     Filter by action (optional)
     * @param userId     Filter by user ID (optional)
     * @param pageable   Pagination parameters
     * @return Page of AuditLogResponse
     */
    public Page<AuditLogResponse> getAuditLogs(
            String entityType,
            AuditAction action,
            Long userId,
            Pageable pageable) {

        return auditLogRepository.findWithFilters(entityType, action, userId, pageable)
                .map(this::toResponse);
    }

    /**
     * Get audit logs for a specific entity.
     *
     * @param entityType Entity type
     * @param entityId   Entity ID
     * @param action     Filter by action (optional)
     * @param pageable   Pagination parameters
     * @return Page of AuditLogResponse
     */
    public Page<AuditLogResponse> getAuditLogsForEntity(
            String entityType,
            Long entityId,
            AuditAction action,
            Pageable pageable) {

        return auditLogRepository.findByEntityWithFilters(entityType, entityId, action, pageable)
                .map(this::toResponse);
    }

    // ==================== Command Operations ====================

    /**
     * Log an audit entry.
     * Called by other services when auditable actions occur.
     *
     * @param entityType Type of entity being audited
     * @param entityId   ID of entity being audited
     * @param action     Action performed
     * @param userId     User performing the action (null for system actions)
     * @param username   Username (denormalized for retention)
     * @param ipAddress  Client IP address
     * @param userAgent  Client user agent
     * @param changes    JSON string of changes (old/new values)
     * @param metadata   Additional JSON metadata
     */
    @Transactional
    public void log(
            String entityType,
            Long entityId,
            AuditAction action,
            Long userId,
            String username,
            String ipAddress,
            String userAgent,
            String changes,
            String metadata) {

        AuditLog auditLog = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .userId(userId)
                .username(username)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .changes(changes)
                .metadata(metadata)
                .build();

        auditLogRepository.save(auditLog);
    }

    /**
     * Log a simple audit entry without detailed changes.
     *
     * @param entityType Type of entity
     * @param entityId   Entity ID
     * @param action     Action performed
     * @param userId     User ID
     * @param username   Username
     */
    @Transactional
    public void logSimple(
            String entityType,
            Long entityId,
            AuditAction action,
            Long userId,
            String username) {

        log(entityType, entityId, action, userId, username, null, null, null, null);
    }

    // ==================== Helper Methods ====================

    private AuditLogResponse toResponse(AuditLog auditLog) {
        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getAction().name(),
                auditLog.getUserId(),
                auditLog.getUsername(),
                auditLog.getIpAddress(),
                auditLog.getChanges(),
                auditLog.getMetadata(),
                auditLog.getCreatedAt()
        );
    }
}
