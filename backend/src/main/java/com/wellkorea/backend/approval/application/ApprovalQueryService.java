package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.approval.api.dto.query.*;
import com.wellkorea.backend.approval.domain.ApprovalChainTemplate;
import com.wellkorea.backend.approval.domain.ApprovalHistory;
import com.wellkorea.backend.approval.domain.ApprovalRequest;
import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.ApprovalChainLevel;
import com.wellkorea.backend.approval.domain.vo.ApprovalLevelDecision;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.approval.infrastructure.mapper.ApprovalMapper;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalChainTemplateRepository;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalHistoryRepository;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalRequestRepository;
import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Query service for approval read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 *
 * <p>Uses MyBatis for list queries with filters to avoid N+1 issues on submittedBy.
 * Uses JPA repository for detail queries with level decisions (batch fetching).
 */
@Service
@Transactional(readOnly = true)
public class ApprovalQueryService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final ApprovalHistoryRepository historyRepository;
    private final ApprovalChainTemplateRepository chainTemplateRepository;
    private final UserRepository userRepository;
    private final ApprovalMapper approvalMapper;

    public ApprovalQueryService(
            ApprovalRequestRepository approvalRequestRepository,
            ApprovalHistoryRepository historyRepository,
            ApprovalChainTemplateRepository chainTemplateRepository,
            UserRepository userRepository,
            ApprovalMapper approvalMapper) {
        this.approvalRequestRepository = approvalRequestRepository;
        this.historyRepository = historyRepository;
        this.chainTemplateRepository = chainTemplateRepository;
        this.userRepository = userRepository;
        this.approvalMapper = approvalMapper;
    }

    /**
     * Get approval detail by ID.
     * Returns full detail view including level decisions with user names resolved.
     */
    public ApprovalDetailView getApprovalDetail(Long approvalRequestId) {
        ApprovalRequest request = approvalRequestRepository.findByIdWithLevelDecisions(approvalRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Approval request not found with ID: " + approvalRequestId));
        return toApprovalDetailViewWithUserNames(request);
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
     * Returns view DTOs for API consumption with user names resolved.
     */
    public List<ChainTemplateView> listChainTemplates() {
        List<ApprovalChainTemplate> templates = chainTemplateRepository.findAll();
        return templates.stream()
                .map(this::toChainTemplateViewWithUserNames)
                .toList();
    }

    /**
     * Get chain template by ID.
     * Returns view DTO for API consumption with user names resolved.
     */
    public ChainTemplateView getChainTemplate(Long chainTemplateId) {
        ApprovalChainTemplate template = chainTemplateRepository.findByIdWithLevels(chainTemplateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Chain template not found with ID: " + chainTemplateId));
        return toChainTemplateViewWithUserNames(template);
    }

    /**
     * Check if approval request exists.
     */
    public boolean exists(Long approvalRequestId) {
        return approvalRequestRepository.existsById(approvalRequestId);
    }

    /**
     * Convert ApprovalRequest to ApprovalDetailView with user names resolved for all level decisions.
     */
    private ApprovalDetailView toApprovalDetailViewWithUserNames(ApprovalRequest request) {
        List<ApprovalLevelDecision> decisions = request.getLevelDecisions();

        // Collect all user IDs from level decisions (expected approvers and decided by)
        List<Long> userIds = decisions.stream()
                .flatMap(d -> Stream.of(d.getExpectedApproverUserId(), d.getDecidedByUserId()))
                .filter(id -> id != null)
                .distinct()
                .toList();

        // Batch fetch users
        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        // Build level decision views with user names (level names are now stored in decisions)
        List<LevelDecisionView> levelViews = decisions.stream()
                .map(decision -> LevelDecisionView.from(
                        decision,
                        usersById.get(decision.getExpectedApproverUserId()),
                        usersById.get(decision.getDecidedByUserId())
                ))
                .toList();

        return ApprovalDetailView.from(request, levelViews);
    }

    /**
     * Convert template to view with user names resolved for all levels.
     */
    private ChainTemplateView toChainTemplateViewWithUserNames(ApprovalChainTemplate template) {
        List<ApprovalChainLevel> levels = template.getLevels();

        if (levels.isEmpty()) {
            return ChainTemplateView.from(template);
        }

        // Collect all user IDs and batch fetch users
        List<Long> userIds = levels.stream()
                .map(ApprovalChainLevel::getApproverUserId)
                .distinct()
                .toList();

        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        // Build level views with user names
        List<ChainLevelView> levelViews = levels.stream()
                .map(level -> ChainLevelView.from(level, usersById.get(level.getApproverUserId())))
                .toList();

        return ChainTemplateView.from(template, levelViews);
    }
}
