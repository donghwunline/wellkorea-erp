package com.wellkorea.backend.approval.api;

import com.wellkorea.backend.approval.api.dto.*;
import com.wellkorea.backend.approval.application.ApprovalService;
import com.wellkorea.backend.approval.application.ChainLevelCommand;
import com.wellkorea.backend.approval.domain.ApprovalRequest;
import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.EntityType;
import com.wellkorea.backend.auth.api.CurrentToken;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for approval workflow management.
 * Provides endpoints for approval requests and admin chain configuration.
 */
@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final ApprovalService approvalService;
    private final JwtTokenProvider jwtTokenProvider;

    public ApprovalController(ApprovalService approvalService, JwtTokenProvider jwtTokenProvider) {
        this.approvalService = approvalService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * List approval requests.
     * GET /api/approvals
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<Page<ApprovalRequestResponse>>> listApprovals(
            @RequestParam(required = false) EntityType entityType,
            @RequestParam(required = false) ApprovalStatus status,
            @RequestParam(required = false) Boolean myPending,
            @CurrentToken String token,
            Pageable pageable) {

        Page<ApprovalRequest> requests;

        if (Boolean.TRUE.equals(myPending)) {
            Long userId = jwtTokenProvider.getUserId(token);
            requests = approvalService.listPendingApprovals(userId, pageable);
        } else {
            requests = approvalService.listAllApprovals(entityType, status, pageable);
        }

        Page<ApprovalRequestResponse> response = requests.map(ApprovalRequestResponse::fromSummary);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get approval request by ID.
     * GET /api/approvals/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<ApprovalRequestResponse>> getApproval(@PathVariable Long id) {
        ApprovalRequest request = approvalService.getApprovalDetails(id);
        ApprovalRequestResponse response = ApprovalRequestResponse.from(request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Approve at the current level.
     * POST /api/approvals/{id}/approve
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<ApprovalRequestResponse>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveRequest request,
            @CurrentToken String token) {

        Long userId = jwtTokenProvider.getUserId(token);
        String comments = request != null ? request.comments() : null;

        ApprovalRequest approvalRequest = approvalService.approve(id, userId, comments);
        ApprovalRequestResponse response = ApprovalRequestResponse.from(approvalRequest);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Reject at the current level.
     * POST /api/approvals/{id}/reject
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<ApprovalRequestResponse>> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectRequest request,
            @CurrentToken String token) {

        Long userId = jwtTokenProvider.getUserId(token);

        ApprovalRequest approvalRequest = approvalService.reject(
                id, userId, request.reason(), request.comments());
        ApprovalRequestResponse response = ApprovalRequestResponse.from(approvalRequest);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get approval history.
     * GET /api/approvals/{id}/history
     */
    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<List<ApprovalHistoryResponse>>> getHistory(@PathVariable Long id) {
        var history = approvalService.getApprovalHistory(id);
        var response = history.stream()
                .map(ApprovalHistoryResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
