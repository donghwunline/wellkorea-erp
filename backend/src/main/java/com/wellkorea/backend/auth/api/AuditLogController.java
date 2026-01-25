package com.wellkorea.backend.auth.api;

import com.wellkorea.backend.auth.api.dto.AuditLogResponse;
import com.wellkorea.backend.auth.application.AuditService;
import com.wellkorea.backend.auth.domain.vo.AuditAction;
import com.wellkorea.backend.shared.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for audit log endpoints.
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditService auditService;

    public AuditLogController(AuditService auditService) {
        this.auditService = auditService;
    }

    /**
     * GET /api/audit
     * List audit logs with optional filters.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> listAuditLogs(@RequestParam(required = false) String entityType,
                                                                             @RequestParam(required = false) String action,
                                                                             @RequestParam(required = false) Long userId,
                                                                             @RequestParam(required = false) Long entityId,
                                                                             Pageable pageable) {

        Page<AuditLogResponse> logs;

        AuditAction auditAction = action != null ? AuditAction.valueOf(action) : null;

        if (entityType != null && entityId != null) {
            logs = auditService.getAuditLogsForEntity(entityType, entityId, auditAction, pageable);
        } else {
            logs = auditService.getAuditLogs(entityType, auditAction, userId, pageable);
        }

        Map<String, Object> metadata = Map.of(
                "page", logs.getNumber(),
                "size", logs.getSize(),
                "totalElements", logs.getTotalElements(),
                "totalPages", logs.getTotalPages()
        );

        return ResponseEntity.ok(ApiResponse.successWithMetadata(logs, metadata));
    }

    /**
     * GET /api/audit/{id}
     * Get a single audit log entry.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getAuditLog(@PathVariable Long id) {
        return auditService.getById(id)
                .map(log -> ResponseEntity.ok(ApiResponse.success(log)))
                .orElse(ResponseEntity.notFound().build());
    }
}
