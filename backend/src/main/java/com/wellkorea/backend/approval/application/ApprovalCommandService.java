package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.approval.domain.*;
import com.wellkorea.backend.approval.infrastructure.repository.*;
import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.shared.event.DomainEventPublisher;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Command service for approval write operations.
 * Part of CQRS pattern - handles all create/update/delete operations.
 * Returns only entity IDs - clients should fetch fresh data via ApprovalQueryService.
 */
@Service
@Transactional
public class ApprovalCommandService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final ApprovalLevelDecisionRepository levelDecisionRepository;
    private final ApprovalHistoryRepository historyRepository;
    private final ApprovalCommentRepository commentRepository;
    private final ApprovalChainTemplateRepository chainTemplateRepository;
    private final ApprovalChainLevelRepository chainLevelRepository;
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;

    public ApprovalCommandService(
            ApprovalRequestRepository approvalRequestRepository,
            ApprovalLevelDecisionRepository levelDecisionRepository,
            ApprovalHistoryRepository historyRepository,
            ApprovalCommentRepository commentRepository,
            ApprovalChainTemplateRepository chainTemplateRepository,
            ApprovalChainLevelRepository chainLevelRepository,
            UserRepository userRepository,
            DomainEventPublisher eventPublisher) {
        this.approvalRequestRepository = approvalRequestRepository;
        this.levelDecisionRepository = levelDecisionRepository;
        this.historyRepository = historyRepository;
        this.commentRepository = commentRepository;
        this.chainTemplateRepository = chainTemplateRepository;
        this.chainLevelRepository = chainLevelRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create an approval request for an entity.
     * @return ID of the created approval request
     */
    public Long createApprovalRequest(
            EntityType entityType,
            Long entityId,
            String entityDescription,
            Long submittedByUserId) {

        ApprovalChainTemplate chainTemplate = chainTemplateRepository
                .findByEntityTypeWithLevels(entityType)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No approval chain template found for entity type: " + entityType));

        if (!chainTemplate.hasLevels()) {
            throw new BusinessException("Approval chain template has no levels configured");
        }

        User submittedBy = userRepository.findById(submittedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + submittedByUserId));

        ApprovalRequest request = new ApprovalRequest();
        request.setEntityType(entityType);
        request.setEntityId(entityId);
        request.setEntityDescription(entityDescription);
        request.setChainTemplate(chainTemplate);
        request.setCurrentLevel(1);
        request.setTotalLevels(chainTemplate.getTotalLevels());
        request.setStatus(ApprovalStatus.PENDING);
        request.setSubmittedBy(submittedBy);

        // Create level decisions for each level in the chain
        for (ApprovalChainLevel level : chainTemplate.getLevels()) {
            ApprovalLevelDecision decision = new ApprovalLevelDecision();
            decision.setApprovalRequest(request);
            decision.setLevelOrder(level.getLevelOrder());
            decision.setExpectedApprover(level.getApproverUser());
            decision.setDecision(DecisionStatus.PENDING);
            request.getLevelDecisions().add(decision);
        }

        ApprovalRequest savedRequest = approvalRequestRepository.save(request);

        // Record history
        historyRepository.save(ApprovalHistory.submitted(savedRequest, submittedBy));

        return savedRequest.getId();
    }

    /**
     * Approve at the current level.
     * @return ID of the approval request
     */
    public Long approve(Long approvalRequestId, Long approverUserId, String comments) {
        ApprovalRequest request = approvalRequestRepository.findByIdWithLevelDecisions(approvalRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Approval request not found with ID: " + approvalRequestId));

        validateApprovalAction(request, approverUserId);

        User approver = userRepository.findById(approverUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + approverUserId));

        // Get current level decision
        ApprovalLevelDecision currentDecision = request.getCurrentLevelDecision()
                .orElseThrow(() -> new BusinessException("No decision found for current level"));

        // Approve at current level
        currentDecision.approve(approver, comments);
        levelDecisionRepository.save(currentDecision);

        // Record history
        historyRepository.save(ApprovalHistory.approved(request, request.getCurrentLevel(), approver, comments));

        // Check if this is the final level
        if (request.isAtFinalLevel()) {
            request.complete(ApprovalStatus.APPROVED);
        } else {
            // Move to next level
            request.moveToNextLevel();
        }

        ApprovalRequest savedRequest = approvalRequestRepository.save(request);

        // Publish event after final approval (handled by entity-specific handlers)
        if (savedRequest.isCompleted() && savedRequest.getStatus() == ApprovalStatus.APPROVED) {
            eventPublisher.publish(
                    com.wellkorea.backend.approval.domain.event.ApprovalCompletedEvent.approved(
                            savedRequest.getId(),
                            savedRequest.getEntityType(),
                            savedRequest.getEntityId(),
                            approverUserId
                    )
            );
        }

        return savedRequest.getId();
    }

    /**
     * Reject at the current level (requires mandatory reason).
     * @return ID of the approval request
     */
    public Long reject(Long approvalRequestId, Long approverUserId, String reason, String comments) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new BusinessException("Rejection reason is mandatory");
        }

        ApprovalRequest request = approvalRequestRepository.findByIdWithLevelDecisions(approvalRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Approval request not found with ID: " + approvalRequestId));

        validateApprovalAction(request, approverUserId);

        User approver = userRepository.findById(approverUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + approverUserId));

        // Get current level decision
        ApprovalLevelDecision currentDecision = request.getCurrentLevelDecision()
                .orElseThrow(() -> new BusinessException("No decision found for current level"));

        // Reject at current level
        currentDecision.reject(approver, comments);
        levelDecisionRepository.save(currentDecision);

        // Record history
        historyRepository.save(ApprovalHistory.rejected(request, request.getCurrentLevel(), approver, reason));

        // Save rejection reason as a comment
        commentRepository.save(ApprovalComment.rejectionReason(request, approver, reason));

        // Complete the request as rejected (chain stops)
        request.complete(ApprovalStatus.REJECTED);

        ApprovalRequest savedRequest = approvalRequestRepository.save(request);

        // Publish event for rejection (handled by entity-specific handlers)
        eventPublisher.publish(
                com.wellkorea.backend.approval.domain.event.ApprovalCompletedEvent.rejected(
                        savedRequest.getId(),
                        savedRequest.getEntityType(),
                        savedRequest.getEntityId(),
                        reason
                )
        );

        return savedRequest.getId();
    }

    /**
     * Update chain levels (admin only).
     * @return ID of the updated chain template
     */
    public Long updateChainLevels(Long chainTemplateId, List<ChainLevelCommand> commands) {
        ApprovalChainTemplate template = chainTemplateRepository.findById(chainTemplateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Chain template not found with ID: " + chainTemplateId));

        // Validate sequential level orders
        validateLevelOrders(commands);

        // Delete existing levels
        chainLevelRepository.deleteAllByChainTemplateId(chainTemplateId);
        template.getLevels().clear();

        // Create new levels
        for (ChainLevelCommand cmd : commands) {
            User approver = userRepository.findById(cmd.approverUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with ID: " + cmd.approverUserId()));

            ApprovalChainLevel level = new ApprovalChainLevel();
            level.setChainTemplate(template);
            level.setLevelOrder(cmd.levelOrder());
            level.setLevelName(cmd.levelName());
            level.setApproverUser(approver);
            level.setRequired(cmd.isRequired());
            template.getLevels().add(level);
        }

        ApprovalChainTemplate saved = chainTemplateRepository.save(template);
        return saved.getId();
    }

    private void validateApprovalAction(ApprovalRequest request, Long userId) {
        if (request.isCompleted()) {
            throw new BusinessException("Approval request is already completed");
        }

        if (!request.isPending()) {
            throw new BusinessException("Approval request is not in PENDING status");
        }

        // Check if user is the expected approver at current level
        if (!request.isExpectedApprover(userId)) {
            // Check if user is trying to approve out of order
            boolean isApproverAtAnyLevel = request.getLevelDecisions().stream()
                    .anyMatch(d -> d.getExpectedApprover().getId().equals(userId));

            if (isApproverAtAnyLevel) {
                throw new BusinessException("Cannot approve out of order - not at current level");
            } else {
                throw new AccessDeniedException("User is not authorized to approve this request");
            }
        }
    }

    private void validateLevelOrders(List<ChainLevelCommand> commands) {
        if (commands == null || commands.isEmpty()) {
            throw new BusinessException("At least one approval level is required");
        }

        // Sort by level order and check for sequential numbering starting from 1
        List<Integer> orders = commands.stream()
                .map(ChainLevelCommand::levelOrder)
                .sorted()
                .toList();

        for (int i = 0; i < orders.size(); i++) {
            if (orders.get(i) != i + 1) {
                throw new BusinessException("Level orders must be sequential starting from 1");
            }
        }
    }
}
