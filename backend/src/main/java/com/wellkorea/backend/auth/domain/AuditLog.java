package com.wellkorea.backend.auth.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;

/**
 * Immutable audit log entry for tracking all data changes and sensitive access.
 * Stored in database with triggers preventing modification or deletion.
 * <p>
 * This entity is read-only after creation (enforced by DB triggers).
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AuditAction action;

    @Column(name = "user_id")
    private Long userId;

    @Column(length = 100)
    private String username;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(columnDefinition = "jsonb")
    private String changes;

    @Column(columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AuditLog() {
        // JPA requires default constructor
    }

    private AuditLog(Builder builder) {
        this.entityType = builder.entityType;
        this.entityId = builder.entityId;
        this.action = builder.action;
        this.userId = builder.userId;
        this.username = builder.username;
        this.ipAddress = builder.ipAddress;
        this.userAgent = builder.userAgent;
        this.changes = builder.changes;
        this.metadata = builder.metadata;
        this.createdAt = Instant.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public String getEntityType() {
        return entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public AuditAction getAction() {
        return action;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public String getChanges() {
        return changes;
    }

    public String getMetadata() {
        return metadata;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuditLog auditLog = (AuditLog) o;
        return Objects.equals(id, auditLog.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "AuditLog{" +
                "id=" + id +
                ", entityType='" + entityType + '\'' +
                ", entityId=" + entityId +
                ", action=" + action +
                ", username='" + username + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }

    public static class Builder {
        private String entityType;
        private Long entityId;
        private AuditAction action;
        private Long userId;
        private String username;
        private String ipAddress;
        private String userAgent;
        private String changes;
        private String metadata;

        public Builder entityType(String entityType) {
            this.entityType = entityType;
            return this;
        }

        public Builder entityId(Long entityId) {
            this.entityId = entityId;
            return this;
        }

        public Builder action(AuditAction action) {
            this.action = action;
            return this;
        }

        public Builder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public Builder userAgent(String userAgent) {
            this.userAgent = userAgent;
            return this;
        }

        public Builder changes(String changes) {
            this.changes = changes;
            return this;
        }

        public Builder metadata(String metadata) {
            this.metadata = metadata;
            return this;
        }

        public AuditLog build() {
            return new AuditLog(this);
        }
    }
}
