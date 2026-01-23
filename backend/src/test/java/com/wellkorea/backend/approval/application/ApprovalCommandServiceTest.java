package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.approval.domain.ApprovalChainTemplate;
import com.wellkorea.backend.approval.domain.ApprovalRequest;
import com.wellkorea.backend.approval.domain.event.ApprovalCompletedEvent;
import com.wellkorea.backend.approval.domain.vo.*;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalChainTemplateRepository;
import com.wellkorea.backend.approval.infrastructure.repository.ApprovalRequestRepository;
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
 * <p>
 * The ApprovalRequest aggregate now handles:
 * - Validation (completed status, authorization)
 * - Recording history entries (embedded)
 * - Recording comment entries (embedded)
 * - State transitions
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalCommandService Unit Tests - Multi-Level Approval (결재)")
class ApprovalCommandServiceTest {

    @Mock
    private ApprovalRequestRepository approvalRequestRepository;

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

        // Set up chain levels using @Embeddable constructor
        level1 = new ApprovalChainLevel(1, "팀장", 2L, true);
        level2 = new ApprovalChainLevel(2, "부서장", 1L, true);

        // Set up chain template
        chainTemplate = new ApprovalChainTemplate(1L, EntityType.QUOTATION, "견적서 결재", List.of(level1, level2));

        // Create approval request using factory method
        // This properly initializes level decisions and records submission history
        approvalRequest = ApprovalRequest.create(
                EntityType.QUOTATION,
                100L,
                "견적서 v1 - WK2K25-0001-1219",
                submitter,
                chainTemplate
        );
        // Set ID via reflection for testing purposes (normally set by JPA)
        setFieldViaReflection(approvalRequest, "id", 1L);
    }

    /**
     * Helper method to set private fields for testing.
     * This is necessary because ApprovalRequest no longer has setters.
     */
    private void setFieldViaReflection(Object target, String fieldName, Object value) {
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set field " + fieldName, e);
        }
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
                        setFieldViaReflection(ar, "id", 1L);
                        return ar;
                    });

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
            // History is now embedded in the aggregate
            assertThat(savedRequest.getHistoryEntries()).hasSize(1);
            assertThat(savedRequest.getHistoryEntries().getFirst().getAction()).isEqualTo(ApprovalAction.SUBMITTED);
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
                    .hasMessageContaining("ApprovalChainTemplate");
        }

        @Test
        @DisplayName("should throw exception when chain has no levels configured")
        void createApprovalRequest_NoLevels_ThrowsException() {
            // Given
            chainTemplate.replaceAllLevels(List.of());
            given(chainTemplateRepository.findByEntityTypeWithLevels(EntityType.QUOTATION))
                    .willReturn(Optional.of(chainTemplate));
            given(userRepository.findById(4L)).willReturn(Optional.of(submitter));

            // When/Then
            assertThatThrownBy(() ->
                    commandService.createApprovalRequest(EntityType.QUOTATION, 100L, "Test", 4L))
                    .isInstanceOf(IllegalArgumentException.class)
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
            given(userRepository.existsById(2L)).willReturn(true);
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
            // History is now embedded in the aggregate (initial submission + approval)
            assertThat(approvalRequest.getHistoryEntries()).hasSize(2);
            assertThat(approvalRequest.getHistoryEntries().get(1).getAction()).isEqualTo(ApprovalAction.APPROVED);
        }

        @Test
        @DisplayName("should complete approval when final level approves and return ID")
        void approve_AtFinalLevel_ReturnsIdAndPublishesEvent() {
            // Given - Simulate Level 1 already approved, now at Level 2
            // First approve at level 1 to advance to level 2
            approvalRequest.approve(2L, "Level 1 approved");

            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.existsById(1L)).willReturn(true);
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
            given(userRepository.existsById(4L)).willReturn(true);

            // When/Then - Sales user (ID 4) is not the expected approver
            assertThatThrownBy(() -> commandService.approve(1L, 4L, "Trying"))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("should throw exception when approving out of order")
        void approve_OutOfOrder_ThrowsException() {
            // Given - Request is at Level 1, but Admin (Level 2 approver) tries to approve
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.existsById(1L)).willReturn(true);

            // When/Then
            assertThatThrownBy(() -> commandService.approve(1L, 1L, "Trying"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("current level");
        }

        @Test
        @DisplayName("should throw exception when approval is already completed")
        void approve_AlreadyCompleted_ThrowsException() {
            // Given - Complete the approval by approving all levels
            approvalRequest.approve(2L, "Level 1 approved");
            approvalRequest.approve(1L, "Level 2 approved"); // Now completed

            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.existsById(2L)).willReturn(true);

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
            given(userRepository.existsById(2L)).willReturn(true);
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
            // History and comments are now embedded in the aggregate
            assertThat(approvalRequest.getHistoryEntries()).hasSize(2); // submission + rejection
            assertThat(approvalRequest.getHistoryEntries().get(1).getAction()).isEqualTo(ApprovalAction.REJECTED);
            assertThat(approvalRequest.getComments()).hasSize(1); // rejection reason
            assertThat(approvalRequest.getComments().getFirst().isRejectionReason()).isTrue();
            // Verify event was published for entity-specific handlers
            verify(eventPublisher).publish(any(ApprovalCompletedEvent.class));
        }

        @Test
        @DisplayName("should throw exception when reason is blank")
        void reject_BlankReason_ThrowsException() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.existsById(2L)).willReturn(true);

            // When/Then - Blank reason is now validated in domain
            assertThatThrownBy(() -> commandService.reject(1L, 2L, "", null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("reason");
        }

        @Test
        @DisplayName("should throw exception when wrong user tries to reject")
        void reject_WrongUser_ThrowsAccessDenied() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.existsById(4L)).willReturn(true);

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
                    .hasMessageContaining("ApprovalChainTemplate");
        }
    }
}
