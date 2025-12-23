package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.approval.domain.*;
import com.wellkorea.backend.approval.domain.event.ApprovalCompletedEvent;
import com.wellkorea.backend.approval.domain.vo.ApprovalChainLevel;
import com.wellkorea.backend.approval.domain.vo.ApprovalLevelDecision;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.approval.infrastructure.repository.*;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.shared.event.DomainEventPublisher;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.verify;

/**
 * Unit tests for ApprovalCommandService.
 * Tests multi-level sequential approval workflow (결재 라인) logic.
 * Following CQRS pattern - command service returns IDs, not entities.
 * <p>
 * Multi-Level Approval Flow:
 * 1. Quotation submitted → ApprovalRequest created with all level decisions
 * 2. Level 1 approver sees pending → Can approve or reject
 * 3. If approved → Moves to Level 2 → Level 2 approver can act
 * 4. If rejected at any level → Chain stops, request marked REJECTED
 * 5. When final level approves → Request marked APPROVED, entity status updated
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalCommandService Unit Tests - Multi-Level Approval (결재)")
class ApprovalCommandServiceTest {

    @Mock
    private ApprovalRequestRepository approvalRequestRepository;

    @Mock
    private ApprovalHistoryRepository historyRepository;

    @Mock
    private ApprovalCommentRepository commentRepository;

    @Mock
    private ApprovalChainTemplateRepository chainTemplateRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DomainEventPublisher eventPublisher;

    @InjectMocks
    private ApprovalCommandService commandService;

    private User level1Approver;
    private User level2Approver;
    private User submitter;
    private ApprovalChainTemplate chainTemplate;
    private ApprovalChainLevel level1;
    private ApprovalChainLevel level2;
    private ApprovalRequest approvalRequest;

    @BeforeEach
    void setUp() {
        // Set up users using builder
        submitter = User.builder()
                .id(4L)
                .username("sales")
                .email("sales@wellkorea.com")
                .passwordHash("hashed")
                .fullName("Sales User")
                .roles(Set.of(Role.SALES))
                .build();

        level1Approver = User.builder()
                .id(2L)
                .username("finance")
                .email("finance@wellkorea.com")
                .passwordHash("hashed")
                .fullName("Finance Manager")
                .roles(Set.of(Role.FINANCE))
                .build();

        level2Approver = User.builder()
                .id(1L)
                .username("admin")
                .email("admin@wellkorea.com")
                .passwordHash("hashed")
                .fullName("Admin User")
                .roles(Set.of(Role.ADMIN))
                .build();

        // Set up chain template
        chainTemplate = new ApprovalChainTemplate();
        chainTemplate.setId(1L);
        chainTemplate.setEntityType(EntityType.QUOTATION);
        chainTemplate.setName("견적서 결재");
        chainTemplate.setActive(true);

        // Set up chain levels using @Embeddable constructor
        level1 = new ApprovalChainLevel(1, "팀장", 2L, true);
        level2 = new ApprovalChainLevel(2, "부서장", 1L, true);

        // Use aggregate method to set levels
        chainTemplate.replaceAllLevels(List.of(level1, level2));

        // Set up approval request with embedded level decisions
        approvalRequest = new ApprovalRequest();
        approvalRequest.setId(1L);
        approvalRequest.setEntityType(EntityType.QUOTATION);
        approvalRequest.setEntityId(100L);
        approvalRequest.setEntityDescription("견적서 v1 - WK2K25-0001-1219");
        approvalRequest.setCurrentLevel(1);
        approvalRequest.setStatus(ApprovalStatus.PENDING);
        approvalRequest.setSubmittedBy(submitter);
        approvalRequest.setSubmittedAt(LocalDateTime.now());

        // Use factory method from chain template to create level decisions
        List<ApprovalLevelDecision> levelDecisions = chainTemplate.createLevelDecisions();
        approvalRequest.initializeLevelDecisions(levelDecisions);
    }

    @Nested
    @DisplayName("createApprovalRequest - Create approval request from entity")
    class CreateApprovalRequestTests {

        @Test
        @DisplayName("should create approval request and return ID")
        void createApprovalRequest_ValidEntity_ReturnsId() {
            // Given
            given(chainTemplateRepository.findByEntityTypeWithLevels(EntityType.QUOTATION))
                    .willReturn(Optional.of(chainTemplate));
            given(userRepository.findById(4L)).willReturn(Optional.of(submitter));
            // Mock approver user existence checks
            given(userRepository.existsById(2L)).willReturn(true);
            given(userRepository.existsById(1L)).willReturn(true);
            given(approvalRequestRepository.save(any(ApprovalRequest.class)))
                    .willAnswer(invocation -> {
                        ApprovalRequest ar = invocation.getArgument(0);
                        ar.setId(1L);
                        return ar;
                    });
            given(historyRepository.save(any(ApprovalHistory.class))).willAnswer(invocation -> invocation.getArgument(0));

            // When
            Long result = commandService.createApprovalRequest(
                    EntityType.QUOTATION, 100L, "견적서 v1", 4L
            );

            // Then
            assertThat(result).isEqualTo(1L);
            ArgumentCaptor<ApprovalRequest> requestCaptor = ArgumentCaptor.forClass(ApprovalRequest.class);
            verify(approvalRequestRepository).save(requestCaptor.capture());
            ApprovalRequest savedRequest = requestCaptor.getValue();
            assertThat(savedRequest.getEntityType()).isEqualTo(EntityType.QUOTATION);
            assertThat(savedRequest.getEntityId()).isEqualTo(100L);
            assertThat(savedRequest.getCurrentLevel()).isEqualTo(1);
            assertThat(savedRequest.getTotalLevels()).isEqualTo(2);
            assertThat(savedRequest.getStatus()).isEqualTo(ApprovalStatus.PENDING);
            assertThat(savedRequest.getLevelDecisions()).hasSize(2);
            verify(historyRepository).save(any(ApprovalHistory.class));
        }

        @Test
        @DisplayName("should throw exception when chain template not found")
        void createApprovalRequest_NoChainTemplate_ThrowsException() {
            // Given
            given(chainTemplateRepository.findByEntityTypeWithLevels(EntityType.QUOTATION))
                    .willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() ->
                    commandService.createApprovalRequest(EntityType.QUOTATION, 100L, "Test", 4L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("chain template");
        }

        @Test
        @DisplayName("should throw exception when chain has no levels configured")
        void createApprovalRequest_NoLevels_ThrowsException() {
            // Given
            chainTemplate.replaceAllLevels(List.of());
            given(chainTemplateRepository.findByEntityTypeWithLevels(EntityType.QUOTATION))
                    .willReturn(Optional.of(chainTemplate));

            // When/Then
            assertThatThrownBy(() ->
                    commandService.createApprovalRequest(EntityType.QUOTATION, 100L, "Test", 4L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("levels");
        }
    }

    @Nested
    @DisplayName("approve - Approve at current level")
    class ApproveTests {

        @Test
        @DisplayName("should approve at Level 1 and return ID")
        void approve_AtLevel1_ReturnsId() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.findById(2L)).willReturn(Optional.of(level1Approver));
            given(historyRepository.save(any(ApprovalHistory.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(approvalRequestRepository.save(any(ApprovalRequest.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // When
            Long result = commandService.approve(1L, 2L, "Approved by Team Lead");

            // Then
            assertThat(result).isEqualTo(1L);
            assertThat(approvalRequest.getCurrentLevel()).isEqualTo(2);
            assertThat(approvalRequest.getStatus()).isEqualTo(ApprovalStatus.PENDING);
            // Check level 1 decision was approved
            ApprovalLevelDecision level1Decision = approvalRequest.getLevelDecision(1).orElseThrow();
            assertThat(level1Decision.getDecision()).isEqualTo(DecisionStatus.APPROVED);
            assertThat(level1Decision.getDecidedByUserId()).isEqualTo(2L);
            verify(historyRepository).save(any(ApprovalHistory.class));
        }

        @Test
        @DisplayName("should complete approval when final level approves and return ID")
        void approve_AtFinalLevel_ReturnsIdAndPublishesEvent() {
            // Given - Simulate Level 1 already approved, now at Level 2
            approvalRequest.setCurrentLevel(2);
            approvalRequest.getLevelDecision(1).ifPresent(d -> d.approve(2L, "Level 1 approved"));

            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.findById(1L)).willReturn(Optional.of(level2Approver));
            given(historyRepository.save(any(ApprovalHistory.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(approvalRequestRepository.save(any(ApprovalRequest.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // When
            Long result = commandService.approve(1L, 1L, "Final approval");

            // Then
            assertThat(result).isEqualTo(1L);
            assertThat(approvalRequest.getStatus()).isEqualTo(ApprovalStatus.APPROVED);
            assertThat(approvalRequest.getCompletedAt()).isNotNull();
            // Check level 2 decision was approved
            ApprovalLevelDecision level2Decision = approvalRequest.getLevelDecision(2).orElseThrow();
            assertThat(level2Decision.getDecision()).isEqualTo(DecisionStatus.APPROVED);
            // Verify event was published for entity-specific handlers
            verify(eventPublisher).publish(any(ApprovalCompletedEvent.class));
        }

        @Test
        @DisplayName("should throw exception when wrong user tries to approve")
        void approve_WrongUser_ThrowsAccessDenied() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));

            // When/Then - Sales user (ID 4) is not the expected approver
            assertThatThrownBy(() -> commandService.approve(1L, 4L, "Trying"))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("should throw exception when approving out of order")
        void approve_OutOfOrder_ThrowsException() {
            // Given - Request is at Level 1, but Admin (Level 2 approver) tries to approve
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));

            // When/Then
            assertThatThrownBy(() -> commandService.approve(1L, 1L, "Trying"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("current level");
        }

        @Test
        @DisplayName("should throw exception when approval is already completed")
        void approve_AlreadyCompleted_ThrowsException() {
            // Given
            approvalRequest.setStatus(ApprovalStatus.APPROVED);
            approvalRequest.setCompletedAt(LocalDateTime.now());

            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));

            // When/Then
            assertThatThrownBy(() -> commandService.approve(1L, 2L, "Trying"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already");
        }

        @Test
        @DisplayName("should throw exception when approval request not found")
        void approve_NotFound_ThrowsException() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> commandService.approve(999L, 2L, "Trying"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("reject - Reject at current level")
    class RejectTests {

        @Test
        @DisplayName("should reject and return ID")
        void reject_WithReason_ReturnsId() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.findById(2L)).willReturn(Optional.of(level1Approver));
            given(historyRepository.save(any(ApprovalHistory.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(commentRepository.save(any(ApprovalComment.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(approvalRequestRepository.save(any(ApprovalRequest.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // When
            Long result = commandService.reject(1L, 2L, "Price too high", "Reduce by 10%");

            // Then
            assertThat(result).isEqualTo(1L);
            assertThat(approvalRequest.getStatus()).isEqualTo(ApprovalStatus.REJECTED);
            assertThat(approvalRequest.getCompletedAt()).isNotNull();
            // Check level 1 decision was rejected
            ApprovalLevelDecision level1Decision = approvalRequest.getLevelDecision(1).orElseThrow();
            assertThat(level1Decision.getDecision()).isEqualTo(DecisionStatus.REJECTED);
            verify(historyRepository).save(any(ApprovalHistory.class));
            verify(commentRepository).save(any(ApprovalComment.class));
            // Verify event was published for entity-specific handlers
            verify(eventPublisher).publish(any(ApprovalCompletedEvent.class));
        }

        @Test
        @DisplayName("should throw exception when rejecting without reason")
        void reject_WithoutReason_ThrowsException() {
            // When/Then - reason check is done before repository call
            assertThatThrownBy(() -> commandService.reject(1L, 2L, null, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("reason");
        }

        @Test
        @DisplayName("should throw exception when reason is empty")
        void reject_EmptyReason_ThrowsException() {
            // When/Then - reason check is done before repository call
            assertThatThrownBy(() -> commandService.reject(1L, 2L, "", null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("reason");
        }

        @Test
        @DisplayName("should throw exception when wrong user tries to reject")
        void reject_WrongUser_ThrowsAccessDenied() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));

            // When/Then
            assertThatThrownBy(() -> commandService.reject(1L, 4L, "Reason", null))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("updateChainLevels - Admin Chain Configuration")
    class UpdateChainLevelsTests {

        @Test
        @DisplayName("should update chain levels and return ID")
        void updateChainLevels_ValidData_ReturnsId() {
            // Given
            List<ChainLevelCommand> commands = List.of(
                    new ChainLevelCommand(1, "팀장", 2L, true),
                    new ChainLevelCommand(2, "부서장", 1L, true),
                    new ChainLevelCommand(3, "사장", 1L, false)
            );

            given(chainTemplateRepository.findById(1L)).willReturn(Optional.of(chainTemplate));
            given(userRepository.existsById(2L)).willReturn(true);
            given(userRepository.existsById(1L)).willReturn(true);
            given(chainTemplateRepository.save(any(ApprovalChainTemplate.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // When
            Long result = commandService.updateChainLevels(1L, commands);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(chainTemplateRepository).save(any(ApprovalChainTemplate.class));
            // Verify the aggregate has 3 levels after update
            assertThat(chainTemplate.getTotalLevels()).isEqualTo(3);
        }

        @Test
        @DisplayName("should throw exception when level order is not sequential")
        void updateChainLevels_NonSequentialOrder_ThrowsException() {
            // Given
            List<ChainLevelCommand> commands = List.of(
                    new ChainLevelCommand(1, "팀장", 2L, true),
                    new ChainLevelCommand(3, "사장", 1L, true) // Skips level 2
            );

            given(chainTemplateRepository.findById(1L)).willReturn(Optional.of(chainTemplate));
            given(userRepository.existsById(2L)).willReturn(true);
            given(userRepository.existsById(1L)).willReturn(true);

            // When/Then
            assertThatThrownBy(() -> commandService.updateChainLevels(1L, commands))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("sequential");
        }

        @Test
        @DisplayName("should throw exception when approver user not found")
        void updateChainLevels_InvalidApprover_ThrowsException() {
            // Given
            List<ChainLevelCommand> commands = List.of(
                    new ChainLevelCommand(1, "팀장", 999L, true)
            );

            given(chainTemplateRepository.findById(1L)).willReturn(Optional.of(chainTemplate));
            given(userRepository.existsById(999L)).willReturn(false);

            // When/Then
            assertThatThrownBy(() -> commandService.updateChainLevels(1L, commands))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }

        @Test
        @DisplayName("should throw exception when chain template not found")
        void updateChainLevels_TemplateNotFound_ThrowsException() {
            // Given
            List<ChainLevelCommand> commands = List.of(
                    new ChainLevelCommand(1, "팀장", 2L, true)
            );

            given(chainTemplateRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> commandService.updateChainLevels(999L, commands))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Chain template");
        }
    }
}
