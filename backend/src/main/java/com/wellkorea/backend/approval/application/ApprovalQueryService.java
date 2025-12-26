package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.approval.api.dto.query.*;
import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.approval.infrastructure.mapper.ApprovalMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for approval read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 *
 * <p>Uses MyBatis for all queries to avoid N+1 issues and optimize read performance.
 */
@Service
@Transactional(readOnly = true)
public class ApprovalQueryService {

    private final ApprovalMapper approvalMapper;

    public ApprovalQueryService(ApprovalMapper approvalMapper) {
        this.approvalMapper = approvalMapper;
    }

    /**
     * Get approval detail by ID.
     * Returns full detail view including level decisions with user names resolved.
     *
     * <p>Uses MyBatis mapper to avoid N+1 queries on users.
     */
    public ApprovalDetailView getApprovalDetail(Long approvalRequestId) {
        return approvalMapper.findDetailById(approvalRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Approval request not found with ID: " + approvalRequestId));
    }

    /**
     * List pending approvals for a user.
     * Returns summary views optimized for list display (no level decisions).
     *
     * <p>Uses MyBatis mapper to avoid N+1 queries on submittedBy user.
     */
    public Page<ApprovalSummaryView> listPendingApprovals(Long userId, Pageable pageable) {
        List<ApprovalSummaryView> content = approvalMapper.findPendingByApproverUserId(
                userId,
                pageable.getPageSize(),
                pageable.getOffset());
        long total = approvalMapper.countPendingByApproverUserId(userId);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * List all approvals with filters.
     * Returns summary views optimized for list display (no level decisions).
     *
     * <p>Uses MyBatis mapper to avoid N+1 queries on submittedBy user.
     */
    public Page<ApprovalSummaryView> listAllApprovals(EntityType entityType, ApprovalStatus status, Pageable pageable) {
        List<ApprovalSummaryView> content = approvalMapper.findAllWithFilters(
                entityType,
                status,
                pageable.getPageSize(),
                pageable.getOffset());
        long total = approvalMapper.countWithFilters(entityType, status);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Get approval history.
     * Returns list of history entries for a specific approval request.
     *
     * <p>Uses MyBatis mapper to avoid N+1 queries on actor user.
     */
    public List<ApprovalHistoryView> getApprovalHistory(Long approvalRequestId) {
        // Verify request exists
        if (!approvalMapper.existsById(approvalRequestId)) {
            throw new ResourceNotFoundException(
                    "Approval request not found with ID: " + approvalRequestId);
        }
        return approvalMapper.findHistoryByRequestId(approvalRequestId);
    }

    /**
     * List all chain templates (for admin).
     * Returns view DTOs for API consumption with user names resolved.
     *
     * <p>Uses MyBatis mapper to avoid N+1 queries on approver users.
     */
    public List<ChainTemplateView> listChainTemplates() {
        return approvalMapper.findAllChainTemplates();
    }

    /**
     * Get chain template by ID.
     * Returns view DTO for API consumption with user names resolved.
     *
     * <p>Uses MyBatis mapper to avoid N+1 queries on approver users.
     */
    public ChainTemplateView getChainTemplate(Long chainTemplateId) {
        return approvalMapper.findChainTemplateById(chainTemplateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Chain template not found with ID: " + chainTemplateId));
    }

    /**
     * Check if approval request exists.
     */
    public boolean exists(Long approvalRequestId) {
        return approvalMapper.existsById(approvalRequestId);
    }
}
