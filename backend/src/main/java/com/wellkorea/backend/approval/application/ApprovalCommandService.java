package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.approval.domain.*;
import com.wellkorea.backend.approval.domain.vo.ApprovalChainLevel;
import com.wellkorea.backend.approval.domain.vo.ApprovalLevelDecision;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalChainTemplateRepository;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalCommentRepository;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalHistoryRepository;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalRequestRepository;
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
    private final ApprovalHistoryRepository historyRepository;
    private final ApprovalCommentRepository commentRepository;
    private final ApprovalChainTemplateRepository chainTemplateRepository;
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;

    public ApprovalCommandService(ApprovalRequestRepository approvalRequestRepository,
                                  ApprovalHistoryRepository historyRepository,
                                  ApprovalCommentRepository commentRepository,
                                  ApprovalChainTemplateRepository chainTemplateRepository,
                                  UserRepository userRepository,
                                  DomainEventPublisher eventPublisher) {
        this.approvalRequestRepository = approvalRequestRepository;
        this.historyRepository = historyRepository;
        this.commentRepository = commentRepository;
        this.chainTemplateRepository = chainTemplateRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create an approval request for an entity.
     *
     * @return ID of the created approval request
     */
    public Long createApprovalRequest(EntityType entityType,
                                      Long entityId,
                                      String entityDescription,
                                      Long submittedByUserId) {

        ApprovalChainTemplate chainTemplate = chainTemplateRepository.findByEntityTypeWithLevels(entityType)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalChainTemplate", entityType));

        if (!chainTemplate.hasLevels()) {
            throw new BusinessException("Approval chain template has no levels configured");
        }

        User submittedBy = userRepository.findById(submittedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", submittedByUserId));

        // Validate all approver users exist
        List<Long> approverUserIds = chainTemplate.getLevels().stream()
                .map(ApprovalChainLevel::getApproverUserId)
                .toList();

        for (Long approverUserId : approverUserIds) {
            if (!userRepository.existsById(approverUserId)) {
                throw new ResourceNotFoundException("User", approverUserId);
            }
        }

        // Create level decisions via factory method (captures level names at creation time)
        List<ApprovalLevelDecision> levelDecisions = chainTemplate.createLevelDecisions();

        ApprovalRequest request = new ApprovalRequest();
        request.setEntityType(entityType);
        request.setEntityId(entityId);
        request.setEntityDescription(entityDescription);
        request.setCurrentLevel(1);
        request.setStatus(ApprovalStatus.PENDING);
        request.setSubmittedBy(submittedBy);

        // Use aggregate method to initialize level decisions
        request.initializeLevelDecisions(levelDecisions);

        ApprovalRequest savedRequest = approvalRequestRepository.save(request);

        // Record history
        historyRepository.save(ApprovalHistory.submitted(savedRequest, submittedBy));

        return savedRequest.getId();
    }

    /**
     * Approve at the current level.
     *
     * @return ID of the approval request
     */
    public Long approve(Long approvalRequestId, Long approverUserId, String comments) {
        ApprovalRequest request = approvalRequestRepository.findByIdWithLevelDecisions(approvalRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalRequest", approvalRequestId));

        validateApprovalAction(request, approverUserId);

        User approver = userRepository.findById(approverUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", approverUserId));

        // Use aggregate method to approve at current level
        request.approveAtCurrentLevel(approverUserId, comments);

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
     * Reject at the current level.
     * Reason validation is handled by @NotBlank on RejectRequest DTO.
     *
     * @return ID of the approval request
     */
    public Long reject(Long approvalRequestId, Long approverUserId, String reason, String comments) {
        ApprovalRequest request = approvalRequestRepository.findByIdWithLevelDecisions(approvalRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalRequest", approvalRequestId));

        validateApprovalAction(request, approverUserId);

        User approver = userRepository.findById(approverUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", approverUserId));

        // Use aggregate method to reject at current level
        request.rejectAtCurrentLevel(approverUserId, comments);

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
     * Uses the aggregate's replaceAllLevels method to enforce encapsulation.
     *
     * @return ID of the updated chain template
     */
    public Long updateChainLevels(Long chainTemplateId, List<ChainLevelCommand> commands) {
        ApprovalChainTemplate template = chainTemplateRepository.findById(chainTemplateId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalChainTemplate", chainTemplateId));

        // Validate that all approver users exist
        for (ChainLevelCommand cmd : commands) {
            if (!userRepository.existsById(cmd.approverUserId())) {
                throw new ResourceNotFoundException("User", cmd.approverUserId());
            }
        }

        // Convert commands to embeddable levels
        List<ApprovalChainLevel> newLevels = commands.stream()
                .map(cmd -> new ApprovalChainLevel(
                        cmd.levelOrder(),
                        cmd.levelName(),
                        cmd.approverUserId(),
                        cmd.isRequired()))
                .toList();

        // Use aggregate method to replace levels (validates ordering internally)
        template.replaceAllLevels(newLevels);

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
            if (request.isApproverAtAnyLevel(userId)) {
                throw new BusinessException("Cannot approve out of order - not at current level");
            } else {
                throw new AccessDeniedException("User is not authorized to approve this request");
            }
        }
    }
}
