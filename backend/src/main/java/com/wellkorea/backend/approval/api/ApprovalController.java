package com.wellkorea.backend.approval.api;

import com.wellkorea.backend.approval.api.dto.command.ApprovalCommandResult;
import com.wellkorea.backend.approval.api.dto.command.ApproveRequest;
import com.wellkorea.backend.approval.api.dto.command.RejectRequest;
import com.wellkorea.backend.approval.api.dto.query.ApprovalDetailView;
import com.wellkorea.backend.approval.api.dto.query.ApprovalHistoryView;
import com.wellkorea.backend.approval.api.dto.query.ApprovalSummaryView;
import com.wellkorea.backend.approval.application.ApprovalCommandService;
import com.wellkorea.backend.approval.application.ApprovalQueryService;
import com.wellkorea.backend.approval.domain.vo.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for approval workflow management.
 * Follows CQRS pattern - uses separate Command and Query services.
 * Command endpoints return only IDs; clients fetch fresh data via query endpoints.
 */
@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final ApprovalCommandService commandService;
    private final ApprovalQueryService queryService;

    public ApprovalController(ApprovalCommandService commandService, ApprovalQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    // ==================== QUERY ENDPOINTS ====================

    /**
     * List approval requests.
     * GET /api/approvals
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<Page<ApprovalSummaryView>>> listApprovals(@RequestParam(required = false) EntityType entityType,
                                                                                @RequestParam(required = false) ApprovalStatus status,
                                                                                @RequestParam(required = false) Boolean myPending,
                                                                                @AuthenticationPrincipal AuthenticatedUser user,
                                                                                Pageable pageable) {

        Page<ApprovalSummaryView> approvals;

        if (Boolean.TRUE.equals(myPending)) {
            Long userId = user.getUserId();
            approvals = queryService.listPendingApprovals(userId, pageable);
        } else {
            approvals = queryService.listAllApprovals(entityType, status, pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(approvals));
    }

    /**
     * Get approval request by ID.
     * GET /api/approvals/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<ApprovalDetailView>> getApproval(@PathVariable Long id) {
        ApprovalDetailView approval = queryService.getApprovalDetail(id);
        return ResponseEntity.ok(ApiResponse.success(approval));
    }

    /**
     * Get approval history.
     * GET /api/approvals/{id}/history
     */
    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<List<ApprovalHistoryView>>> getHistory(@PathVariable Long id) {
        List<ApprovalHistoryView> history = queryService.getApprovalHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    /**
     * Get pending approval count for current user.
     * GET /api/approvals/pending-count
     * Used for badge display in navigation.
     */
    @GetMapping("/pending-count")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<Long>> getPendingCount(@AuthenticationPrincipal AuthenticatedUser user) {
        Long userId = user.getUserId();
        long count = queryService.countPendingForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    // ==================== COMMAND ENDPOINTS ====================

    /**
     * Approve at the current level.
     * POST /api/approvals/{id}/approve
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<ApprovalCommandResult>> approve(@PathVariable Long id,
                                                                      @RequestBody(required = false) ApproveRequest request,
                                                                      @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
        String comments = request != null ? request.comments() : null;

        Long approvalId = commandService.approve(id, userId, comments);
        ApprovalCommandResult result = ApprovalCommandResult.approved(approvalId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Reject at the current level.
     * POST /api/approvals/{id}/reject
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<ApprovalCommandResult>> reject(@PathVariable Long id,
                                                                     @Valid @RequestBody RejectRequest request,
                                                                     @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();

        Long approvalId = commandService.reject(id, userId, request.reason(), request.comments());
        ApprovalCommandResult result = ApprovalCommandResult.rejected(approvalId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
