package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.approval.domain.ApprovalChainTemplate;
import com.wellkorea.backend.approval.domain.ApprovalRequest;
import com.wellkorea.backend.approval.domain.event.ApprovalCompletedEvent;
import com.wellkorea.backend.approval.domain.vo.ApprovalChainLevel;
import com.wellkorea.backend.approval.domain.vo.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalChainTemplateRepository;
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
 * <p>
 * This service is a thin orchestrator that:
 * - Validates external references (user existence)
 * - Delegates business logic to the ApprovalRequest aggregate
 * - Manages transaction boundaries
 * - Publishes domain events for cross-aggregate communication
 */
@Service
@Transactional
public class ApprovalCommandService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final ApprovalChainTemplateRepository chainTemplateRepository;
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;

    public ApprovalCommandService(ApprovalRequestRepository approvalRequestRepository,
                                  ApprovalChainTemplateRepository chainTemplateRepository,
                                  UserRepository userRepository,
                                  DomainEventPublisher eventPublisher) {
        this.approvalRequestRepository = approvalRequestRepository;
        this.chainTemplateRepository = chainTemplateRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create an approval request for an entity.
     * Uses the ApprovalRequest.create() factory method which:
     * - Initializes level decisions from template
     * - Records submission in history
     *
     * @return ID of the created approval request
     */
    public Long createApprovalRequest(EntityType entityType,
                                      Long entityId,
                                      String entityDescription,
                                      Long submittedByUserId) {

        ApprovalChainTemplate chainTemplate = chainTemplateRepository.findByEntityTypeWithLevels(entityType)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalChainTemplate", entityType));

        User submittedBy = userRepository.findById(submittedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", submittedByUserId));

        // Validate all approver users exist (external aggregate check)
        List<Long> approverUserIds = chainTemplate.getLevels().stream()
                .map(ApprovalChainLevel::getApproverUserId)
                .toList();

        for (Long approverUserId : approverUserIds) {
            if (!userRepository.existsById(approverUserId)) {
                throw new ResourceNotFoundException("User", approverUserId);
            }
        }

        // Domain factory handles validation and initializes history
        ApprovalRequest request = ApprovalRequest.create(
                entityType,
                entityId,
                entityDescription,
                submittedBy,
                chainTemplate
        );

        ApprovalRequest savedRequest = approvalRequestRepository.save(request);
        return savedRequest.getId();
    }

    /**
     * Approve at the current level.
     * The domain aggregate handles:
     * - Validation (completed status, authorization)
     * - Recording decision on level
     * - Recording history
     * - State transition (next level or completion)
     *
     * @return ID of the approval request
     */
    public Long approve(Long approvalRequestId, Long approverUserId, String comments) {
        ApprovalRequest request = approvalRequestRepository.findByIdWithLevelDecisions(approvalRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalRequest", approvalRequestId));

        // Verify user exists (external aggregate check)
        if (!userRepository.existsById(approverUserId)) {
            throw new ResourceNotFoundException("User", approverUserId);
        }

        // Delegate to domain - catches domain exceptions and translates to application exceptions
        try {
            request.approve(approverUserId, comments);
        } catch (IllegalStateException e) {
            throw new BusinessException(e.getMessage());
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("not authorized")) {
                throw new AccessDeniedException(e.getMessage());
            }
            throw new BusinessException(e.getMessage());
        }

        ApprovalRequest savedRequest = approvalRequestRepository.save(request);

        // Publish event after final approval (handled by entity-specific handlers)
        if (savedRequest.isCompleted() && savedRequest.getStatus() == ApprovalStatus.APPROVED) {
            eventPublisher.publish(
                    ApprovalCompletedEvent.approved(
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
     * The domain aggregate handles:
     * - Validation (completed status, authorization, reason required)
     * - Recording decision on level
     * - Recording history
     * - Saving rejection reason as comment
     * - Completing the request as rejected
     *
     * @return ID of the approval request
     */
    public Long reject(Long approvalRequestId, Long approverUserId, String reason, String comments) {
        ApprovalRequest request = approvalRequestRepository.findByIdWithLevelDecisions(approvalRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalRequest", approvalRequestId));

        // Verify user exists (external aggregate check)
        if (!userRepository.existsById(approverUserId)) {
            throw new ResourceNotFoundException("User", approverUserId);
        }

        // Delegate to domain - catches domain exceptions and translates to application exceptions
        try {
            request.reject(approverUserId, reason, comments);
        } catch (IllegalStateException e) {
            throw new BusinessException(e.getMessage());
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("not authorized")) {
                throw new AccessDeniedException(e.getMessage());
            }
            throw new BusinessException(e.getMessage());
        }

        ApprovalRequest savedRequest = approvalRequestRepository.save(request);

        // Publish event for rejection (handled by entity-specific handlers)
        eventPublisher.publish(
                ApprovalCompletedEvent.rejected(
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

        // Validate that all approver users exist (external aggregate check)
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
}
