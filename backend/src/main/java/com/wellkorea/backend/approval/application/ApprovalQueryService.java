package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.approval.api.dto.query.ApprovalDetailView;
import com.wellkorea.backend.approval.api.dto.query.ApprovalHistoryView;
import com.wellkorea.backend.approval.api.dto.query.ApprovalSummaryView;
import com.wellkorea.backend.approval.domain.*;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalChainTemplateRepository;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalHistoryRepository;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalRequestRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for approval read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 */
@Service
@Transactional(readOnly = true)
public class ApprovalQueryService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final ApprovalHistoryRepository historyRepository;
    private final ApprovalChainTemplateRepository chainTemplateRepository;

    public ApprovalQueryService(
            ApprovalRequestRepository approvalRequestRepository,
            ApprovalHistoryRepository historyRepository,
            ApprovalChainTemplateRepository chainTemplateRepository) {
        this.approvalRequestRepository = approvalRequestRepository;
        this.historyRepository = historyRepository;
        this.chainTemplateRepository = chainTemplateRepository;
    }

    /**
     * Get approval detail by ID.
     * Returns full detail view including level decisions.
     */
    public ApprovalDetailView getApprovalDetail(Long approvalRequestId) {
        ApprovalRequest request = approvalRequestRepository.findByIdWithLevelDecisions(approvalRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Approval request not found with ID: " + approvalRequestId));
        return ApprovalDetailView.from(request);
    }

    /**
     * List pending approvals for a user.
     * Returns summary views optimized for list display (no level decisions).
     */
    public Page<ApprovalSummaryView> listPendingApprovals(Long userId, Pageable pageable) {
        Page<ApprovalRequest> requests = approvalRequestRepository.findPendingByApproverUserId(userId, pageable);
        return requests.map(ApprovalSummaryView::from);
    }

    /**
     * List all approvals with filters.
     * Returns summary views optimized for list display (no level decisions).
     */
    public Page<ApprovalSummaryView> listAllApprovals(EntityType entityType, ApprovalStatus status, Pageable pageable) {
        Page<ApprovalRequest> requests = approvalRequestRepository.findAllWithFilters(entityType, status, pageable);
        return requests.map(ApprovalSummaryView::from);
    }

    /**
     * Get approval history.
     * Returns list of history entries for a specific approval request.
     */
    public List<ApprovalHistoryView> getApprovalHistory(Long approvalRequestId) {
        // Verify request exists
        approvalRequestRepository.findById(approvalRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Approval request not found with ID: " + approvalRequestId));

        List<ApprovalHistory> history = historyRepository.findByApprovalRequestIdOrderByCreatedAtAsc(approvalRequestId);
        return history.stream()
                .map(ApprovalHistoryView::from)
                .toList();
    }

    /**
     * List all chain templates (for admin).
     * Returns raw entities as they are already optimized for admin views.
     */
    public List<ApprovalChainTemplate> listChainTemplates() {
        return chainTemplateRepository.findAll();
    }

    /**
     * Get chain template by ID.
     */
    public ApprovalChainTemplate getChainTemplate(Long chainTemplateId) {
        return chainTemplateRepository.findByIdWithLevels(chainTemplateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Chain template not found with ID: " + chainTemplateId));
    }

    /**
     * Check if approval request exists.
     */
    public boolean exists(Long approvalRequestId) {
        return approvalRequestRepository.existsById(approvalRequestId);
    }
}
