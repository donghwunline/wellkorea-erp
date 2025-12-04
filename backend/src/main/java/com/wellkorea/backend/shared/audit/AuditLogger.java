package com.wellkorea.backend.shared.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Service for manual audit logging to the immutable audit_logs table.
 * Handles actions that are not automatically captured by database triggers:
 * - VIEW: When users view sensitive documents (quotations, invoices, financial reports)
 * - DOWNLOAD: When users download files (PDFs, Excel exports)
 * - ACCESS_DENIED: When authorization fails (tracked from GlobalExceptionHandler)
 * <p>
 * Database triggers automatically capture CREATE, UPDATE, DELETE for sensitive tables.
 * This service complements those triggers for application-level actions.
 * <p>
 * Thread-safe and uses REQUIRES_NEW propagation to ensure audit logs are always persisted
 * even if the parent transaction rolls back (US9 requirement).
 */
@Service
public class AuditLogger {

    private static final Logger log = LoggerFactory.getLogger(AuditLogger.class);

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public AuditLogger(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Log a VIEW action when users access sensitive resources.
     *
     * @param entityType Entity type being viewed (e.g., "Quotation", "TaxInvoice")
     * @param entityId   ID of the entity
     * @param userId     ID of the user viewing the resource (nullable for anonymous access)
     * @param username   Username for audit retention (denormalized)
     * @param ipAddress  Client IP address
     * @param userAgent  Client user agent string
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logView(String entityType, Long entityId, Long userId, String username,
                        String ipAddress, String userAgent) {
        logAudit(entityType, entityId, "VIEW", userId, username, ipAddress, userAgent, null, null);
    }

    /**
     * Log a DOWNLOAD action when users download files.
     *
     * @param entityType Entity type being downloaded (e.g., "Quotation", "TaxInvoice")
     * @param entityId   ID of the entity
     * @param userId     ID of the user downloading
     * @param username   Username for audit retention
     * @param ipAddress  Client IP address
     * @param userAgent  Client user agent string
     * @param metadata   Additional context (e.g., file format, file size)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logDownload(String entityType, Long entityId, Long userId, String username,
                            String ipAddress, String userAgent, Map<String, Object> metadata) {
        logAudit(entityType, entityId, "DOWNLOAD", userId, username, ipAddress, userAgent, null, metadata);
    }

    /**
     * Log an ACCESS_DENIED action when authorization fails.
     *
     * @param entityType Entity type user attempted to access
     * @param entityId   ID of the entity (nullable if access denied before entity lookup)
     * @param userId     ID of the user (nullable if not authenticated)
     * @param username   Username for audit retention (nullable)
     * @param ipAddress  Client IP address
     * @param userAgent  Client user agent string
     * @param metadata   Additional context (e.g., required role, attempted action)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAccessDenied(String entityType, Long entityId, Long userId, String username,
                                String ipAddress, String userAgent, Map<String, Object> metadata) {
        logAudit(entityType, entityId, "ACCESS_DENIED", userId, username, ipAddress, userAgent, null, metadata);
    }

    /**
     * Log a LOGIN action for successful authentication.
     *
     * @param userId    ID of the user logging in
     * @param username  Username for audit retention
     * @param ipAddress Client IP address
     * @param userAgent Client user agent string
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogin(Long userId, String username, String ipAddress, String userAgent) {
        logAudit("User", userId, "LOGIN", userId, username, ipAddress, userAgent, null, null);
    }

    /**
     * Log a LOGOUT action when user logs out.
     *
     * @param userId    ID of the user logging out
     * @param username  Username for audit retention
     * @param ipAddress Client IP address
     * @param userAgent Client user agent string
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogout(Long userId, String username, String ipAddress, String userAgent) {
        logAudit("User", userId, "LOGOUT", userId, username, ipAddress, userAgent, null, null);
    }

    /**
     * Log an APPROVE action for approval workflows.
     *
     * @param entityType Entity type being approved (e.g., "Quotation")
     * @param entityId   ID of the entity
     * @param userId     ID of the user approving
     * @param username   Username for audit retention
     * @param ipAddress  Client IP address
     * @param userAgent  Client user agent string
     * @param metadata   Approval comments or additional context
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logApprove(String entityType, Long entityId, Long userId, String username,
                           String ipAddress, String userAgent, Map<String, Object> metadata) {
        logAudit(entityType, entityId, "APPROVE", userId, username, ipAddress, userAgent, null, metadata);
    }

    /**
     * Log a REJECT action for approval workflows.
     *
     * @param entityType Entity type being rejected (e.g., "Quotation")
     * @param entityId   ID of the entity
     * @param userId     ID of the user rejecting
     * @param username   Username for audit retention
     * @param ipAddress  Client IP address
     * @param userAgent  Client user agent string
     * @param metadata   Rejection reason or comments
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logReject(String entityType, Long entityId, Long userId, String username,
                          String ipAddress, String userAgent, Map<String, Object> metadata) {
        logAudit(entityType, entityId, "REJECT", userId, username, ipAddress, userAgent, null, metadata);
    }

    /**
     * Generic audit logging method.
     * Uses REQUIRES_NEW propagation to ensure audit logs persist even if parent transaction rolls back.
     *
     * @param entityType Entity type
     * @param entityId   Entity ID
     * @param action     Action type (VIEW, DOWNLOAD, ACCESS_DENIED, etc.)
     * @param userId     User ID (nullable)
     * @param username   Username (denormalized for audit retention)
     * @param ipAddress  Client IP address
     * @param userAgent  Client user agent
     * @param changes    JSONB changes (nullable for non-mutation actions)
     * @param metadata   Additional metadata (nullable)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(String entityType, Long entityId, String action,
                         Long userId, String username, String ipAddress, String userAgent,
                         Map<String, Object> changes, Map<String, Object> metadata) {
        try {
            String changesSql = changes != null ? objectMapper.writeValueAsString(changes) : null;
            String metadataSql = metadata != null ? objectMapper.writeValueAsString(metadata) : null;

            String sql = """
                    INSERT INTO audit_logs (entity_type, entity_id, action, user_id, username,
                                           ip_address, user_agent, changes, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb)
                    """;

            jdbcTemplate.update(sql, entityType, entityId, action, userId, username,
                    ipAddress, userAgent, changesSql, metadataSql);

            log.debug("Audit logged: {} {} on {} id={} by user={}", action, entityType, entityType, entityId, username);

        } catch (Exception e) {
            // Log error but don't throw - audit logging should not break application flow
            log.error("Failed to write audit log: action={}, entityType={}, entityId={}, user={}",
                    action, entityType, entityId, username, e);
        }
    }

    /**
     * Query recent audit logs for an entity (for audit trail display).
     * Note: This is a read-only operation for displaying audit history.
     *
     * @param entityType Entity type
     * @param entityId   Entity ID
     * @param limit      Maximum number of records to return
     * @return List of audit log maps
     */
    public java.util.List<Map<String, Object>> getAuditTrail(String entityType, Long entityId, int limit) {
        String sql = """
                SELECT id, entity_type, entity_id, action, user_id, username,
                       ip_address, user_agent, changes, metadata, created_at
                FROM audit_logs
                WHERE entity_type = ? AND entity_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """;

        return jdbcTemplate.queryForList(sql, entityType, entityId, limit);
    }

    /**
     * Query audit logs by user (for user activity report).
     *
     * @param userId User ID
     * @param limit  Maximum number of records to return
     * @return List of audit log maps
     */
    public java.util.List<Map<String, Object>> getUserActivity(Long userId, int limit) {
        String sql = """
                SELECT id, entity_type, entity_id, action, user_id, username,
                       ip_address, user_agent, changes, metadata, created_at
                FROM audit_logs
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """;

        return jdbcTemplate.queryForList(sql, userId, limit);
    }

    /**
     * Query audit logs by action type (for security monitoring).
     *
     * @param action Action type (e.g., "ACCESS_DENIED", "LOGIN")
     * @param limit  Maximum number of records to return
     * @return List of audit log maps
     */
    public java.util.List<Map<String, Object>> getAuditLogsByAction(String action, int limit) {
        String sql = """
                SELECT id, entity_type, entity_id, action, user_id, username,
                       ip_address, user_agent, changes, metadata, created_at
                FROM audit_logs
                WHERE action = ?
                ORDER BY created_at DESC
                LIMIT ?
                """;

        return jdbcTemplate.queryForList(sql, action, limit);
    }
}
