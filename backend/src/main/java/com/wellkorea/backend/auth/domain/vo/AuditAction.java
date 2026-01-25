package com.wellkorea.backend.auth.domain.vo;

/**
 * Types of actions that are audited.
 * Matches the CHECK constraint in audit_logs table.
 */
public enum AuditAction {
    CREATE,
    UPDATE,
    DELETE,
    VIEW,
    DOWNLOAD,
    APPROVE,
    REJECT,
    LOGIN,
    LOGOUT,
    ACCESS_DENIED
}
