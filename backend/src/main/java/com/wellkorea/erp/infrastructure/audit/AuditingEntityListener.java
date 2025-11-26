package com.wellkorea.erp.infrastructure.audit;

import com.wellkorea.erp.security.rbac.SecurityUtils;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity Listener for automatic auditing of created_by/updated_by fields
 * Usage: Add @EntityListeners(AuditingEntityListener.class) to entity
 */
public class AuditingEntityListener {

    @PrePersist
    public void setCreatedBy(Object entity) {
        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        Instant now = Instant.now();

        invokeSetterIfExists(entity, "setCreatedBy", UUID.class, currentUserId);
        invokeSetterIfExists(entity, "setCreatedAt", Instant.class, now);
        invokeSetterIfExists(entity, "setUpdatedBy", UUID.class, currentUserId);
        invokeSetterIfExists(entity, "setUpdatedAt", Instant.class, now);
    }

    @PreUpdate
    public void setUpdatedBy(Object entity) {
        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        Instant now = Instant.now();

        invokeSetterIfExists(entity, "setUpdatedBy", UUID.class, currentUserId);
        invokeSetterIfExists(entity, "setUpdatedAt", Instant.class, now);
    }

    private void invokeSetterIfExists(Object entity, String methodName, Class<?> paramType, Object value) {
        try {
            Method method = entity.getClass().getMethod(methodName, paramType);
            method.invoke(entity, value);
        } catch (NoSuchMethodException e) {
            // Method doesn't exist - that's OK, not all entities have all audit fields
        } catch (Exception e) {
            // Log but don't fail the operation
            System.err.println("Failed to invoke " + methodName + ": " + e.getMessage());
        }
    }
}
