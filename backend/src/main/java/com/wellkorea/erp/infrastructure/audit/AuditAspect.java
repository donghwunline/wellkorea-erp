package com.wellkorea.erp.infrastructure.audit;

import com.wellkorea.erp.security.rbac.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Aspect for automatic audit logging of annotated methods
 */
@Aspect
@Component
public class AuditAspect {

    private static final Logger logger = LoggerFactory.getLogger(AuditAspect.class);

    @Autowired
    private AuditLogRepository auditLogRepository;

    @AfterReturning("@annotation(auditable)")
    public void auditMethod(JoinPoint joinPoint, Auditable auditable) {
        try {
            UUID userId = SecurityUtils.getCurrentUserId().orElse(null);
            String ipAddress = getClientIpAddress();

            Map<String, Object> details = new HashMap<>();
            details.put("method", joinPoint.getSignature().getName());
            details.put("class", joinPoint.getTarget().getClass().getSimpleName());

            // Extract entity ID from method arguments if available
            UUID entityId = extractEntityId(joinPoint.getArgs());

            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .entityType(auditable.entityType())
                    .entityId(entityId)
                    .action(auditable.action())
                    .ipAddress(ipAddress)
                    .details(details)
                    .build();

            auditLogRepository.save(auditLog);
            logger.debug("Audit log created: {} {} on {} by user {}",
                    auditable.action(), auditable.entityType(), entityId, userId);
        } catch (Exception e) {
            logger.error("Failed to create audit log", e);
        }
    }

    private UUID extractEntityId(Object[] args) {
        for (Object arg : args) {
            if (arg instanceof UUID) {
                return (UUID) arg;
            }
        }
        return null;
    }

    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            logger.warn("Could not determine client IP address", e);
        }
        return null;
    }
}
