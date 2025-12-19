package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.approval.domain.*;
import com.wellkorea.backend.approval.infrastructure.repository.*;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.quotation.application.QuotationService;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for ApprovalService.
 * Tests multi-level sequential approval workflow (결재 라인) logic.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * Multi-Level Approval Flow:
 * 1. Quotation submitted → ApprovalRequest created with all level decisions
 * 2. Level 1 approver sees pending → Can approve or reject
 * 3. If approved → Moves to Level 2 → Level 2 approver can act
 * 4. If rejected at any level → Chain stops, request marked REJECTED
 * 5. When final level approves → Request marked APPROVED, entity status updated
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalService Unit Tests - Multi-Level Approval (결재)")
class ApprovalServiceTest {

    @Mock
    private ApprovalRequestRepository approvalRequestRepository;

    @Mock
    private ApprovalLevelDecisionRepository levelDecisionRepository;

    @Mock
    private ApprovalHistoryRepository historyRepository;

    @Mock
    private ApprovalCommentRepository commentRepository;

    @Mock
    private ApprovalChainTemplateRepository chainTemplateRepository;

    @Mock
    private ApprovalChainLevelRepository chainLevelRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private QuotationService quotationService;

    @InjectMocks
    private ApprovalService approvalService;

    private User level1Approver;
    private User level2Approver;
    private User submitter;
    private ApprovalChainTemplate chainTemplate;
    private ApprovalChainLevel level1;
    private ApprovalChainLevel level2;
    private ApprovalRequest approvalRequest;
    private ApprovalLevelDecision level1Decision;
    private ApprovalLevelDecision level2Decision;

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

        // Set up chain levels
        level1 = new ApprovalChainLevel();
        level1.setId(1L);
        level1.setChainTemplate(chainTemplate);
        level1.setLevelOrder(1);
        level1.setLevelName("팀장");
        level1.setApproverUser(level1Approver);
        level1.setRequired(true);

        level2 = new ApprovalChainLevel();
        level2.setId(2L);
        level2.setChainTemplate(chainTemplate);
        level2.setLevelOrder(2);
        level2.setLevelName("부서장");
        level2.setApproverUser(level2Approver);
        level2.setRequired(true);

        chainTemplate.setLevels(new ArrayList<>(List.of(level1, level2)));

        // Set up approval request
        approvalRequest = new ApprovalRequest();
        approvalRequest.setId(1L);
        approvalRequest.setEntityType(EntityType.QUOTATION);
        approvalRequest.setEntityId(100L);
        approvalRequest.setEntityDescription("견적서 v1 - WK2K25-0001-1219");
        approvalRequest.setChainTemplate(chainTemplate);
        approvalRequest.setCurrentLevel(1);
        approvalRequest.setTotalLevels(2);
        approvalRequest.setStatus(ApprovalStatus.PENDING);
        approvalRequest.setSubmittedBy(submitter);
        approvalRequest.setSubmittedAt(LocalDateTime.now());

        // Set up level decisions
        level1Decision = new ApprovalLevelDecision();
        level1Decision.setId(1L);
        level1Decision.setApprovalRequest(approvalRequest);
        level1Decision.setLevelOrder(1);
        level1Decision.setExpectedApprover(level1Approver);
        level1Decision.setDecision(DecisionStatus.PENDING);

        level2Decision = new ApprovalLevelDecision();
        level2Decision.setId(2L);
        level2Decision.setApprovalRequest(approvalRequest);
        level2Decision.setLevelOrder(2);
        level2Decision.setExpectedApprover(level2Approver);
        level2Decision.setDecision(DecisionStatus.PENDING);

        approvalRequest.setLevelDecisions(new ArrayList<>(List.of(level1Decision, level2Decision)));
    }

    @Nested
    @DisplayName("createApprovalRequest - T074: Create approval request from entity")
    class CreateApprovalRequestTests {

        @Test
        @DisplayName("should create approval request with all level decisions")
        void createApprovalRequest_ValidEntity_CreatesWithAllLevels() {
            // Given
            given(chainTemplateRepository.findByEntityTypeWithLevels(EntityType.QUOTATION))
                    .willReturn(Optional.of(chainTemplate));
            given(userRepository.findById(4L)).willReturn(Optional.of(submitter));
            given(approvalRequestRepository.save(any(ApprovalRequest.class)))
                    .willAnswer(invocation -> {
                        ApprovalRequest ar = invocation.getArgument(0);
                        ar.setId(1L);
                        return ar;
                    });
            given(historyRepository.save(any(ApprovalHistory.class))).willAnswer(invocation -> invocation.getArgument(0));

            // When
            ApprovalRequest result = approvalService.createApprovalRequest(
                    EntityType.QUOTATION, 100L, "견적서 v1", 4L
            );

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getEntityType()).isEqualTo(EntityType.QUOTATION);
            assertThat(result.getEntityId()).isEqualTo(100L);
            assertThat(result.getCurrentLevel()).isEqualTo(1);
            assertThat(result.getTotalLevels()).isEqualTo(2);
            assertThat(result.getStatus()).isEqualTo(ApprovalStatus.PENDING);
            verify(approvalRequestRepository).save(any(ApprovalRequest.class));
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
                    approvalService.createApprovalRequest(EntityType.QUOTATION, 100L, "Test", 4L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("chain template");
        }

        @Test
        @DisplayName("should throw exception when chain has no levels configured")
        void createApprovalRequest_NoLevels_ThrowsException() {
            // Given
            chainTemplate.setLevels(new ArrayList<>());
            given(chainTemplateRepository.findByEntityTypeWithLevels(EntityType.QUOTATION))
                    .willReturn(Optional.of(chainTemplate));

            // When/Then
            assertThatThrownBy(() ->
                    approvalService.createApprovalRequest(EntityType.QUOTATION, 100L, "Test", 4L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("levels");
        }
    }

    @Nested
    @DisplayName("approve - T074: Approve at current level")
    class ApproveTests {

        @Test
        @DisplayName("should approve at Level 1 and move to Level 2")
        void approve_AtLevel1_MovesToLevel2() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.findById(2L)).willReturn(Optional.of(level1Approver));
            given(levelDecisionRepository.save(any(ApprovalLevelDecision.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(historyRepository.save(any(ApprovalHistory.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(approvalRequestRepository.save(any(ApprovalRequest.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // When
            ApprovalRequest result = approvalService.approve(1L, 2L, "Approved by Team Lead");

            // Then
            assertThat(result.getCurrentLevel()).isEqualTo(2);
            assertThat(result.getStatus()).isEqualTo(ApprovalStatus.PENDING);
            assertThat(level1Decision.getDecision()).isEqualTo(DecisionStatus.APPROVED);
            assertThat(level1Decision.getDecidedBy()).isEqualTo(level1Approver);
            assertThat(level1Decision.getDecidedAt()).isNotNull();
            verify(historyRepository).save(any(ApprovalHistory.class));
        }

        @Test
        @DisplayName("should complete approval when final level approves")
        void approve_AtFinalLevel_CompletesApproval() {
            // Given
            approvalRequest.setCurrentLevel(2);
            level1Decision.setDecision(DecisionStatus.APPROVED);
            level1Decision.setDecidedBy(level1Approver);
            level1Decision.setDecidedAt(LocalDateTime.now());

            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.findById(1L)).willReturn(Optional.of(level2Approver));
            given(levelDecisionRepository.save(any(ApprovalLevelDecision.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(historyRepository.save(any(ApprovalHistory.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(approvalRequestRepository.save(any(ApprovalRequest.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // When
            ApprovalRequest result = approvalService.approve(1L, 1L, "Final approval");

            // Then
            assertThat(result.getStatus()).isEqualTo(ApprovalStatus.APPROVED);
            assertThat(result.getCompletedAt()).isNotNull();
            assertThat(level2Decision.getDecision()).isEqualTo(DecisionStatus.APPROVED);
            verify(quotationService).approveQuotation(eq(100L), eq(1L));
        }

        @Test
        @DisplayName("should throw exception when wrong user tries to approve")
        void approve_WrongUser_ThrowsAccessDenied() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));

            // When/Then - Sales user (ID 4) is not the expected approver
            assertThatThrownBy(() -> approvalService.approve(1L, 4L, "Trying"))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("should throw exception when approving out of order")
        void approve_OutOfOrder_ThrowsException() {
            // Given - Request is at Level 1, but Admin (Level 2 approver) tries to approve
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));

            // When/Then
            assertThatThrownBy(() -> approvalService.approve(1L, 1L, "Trying"))
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
            assertThatThrownBy(() -> approvalService.approve(1L, 2L, "Trying"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already");
        }

        @Test
        @DisplayName("should throw exception when approval request not found")
        void approve_NotFound_ThrowsException() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> approvalService.approve(999L, 2L, "Trying"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("reject - T074: Reject at current level")
    class RejectTests {

        @Test
        @DisplayName("should reject and stop the chain")
        void reject_WithReason_StopsChain() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));
            given(userRepository.findById(2L)).willReturn(Optional.of(level1Approver));
            given(levelDecisionRepository.save(any(ApprovalLevelDecision.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(historyRepository.save(any(ApprovalHistory.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(commentRepository.save(any(ApprovalComment.class))).willAnswer(invocation -> invocation.getArgument(0));
            given(commentRepository.findByApprovalRequestIdAndRejectionReasonTrue(1L)).willReturn(Optional.empty());
            given(approvalRequestRepository.save(any(ApprovalRequest.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // When
            ApprovalRequest result = approvalService.reject(1L, 2L, "Price too high", "Reduce by 10%");

            // Then
            assertThat(result.getStatus()).isEqualTo(ApprovalStatus.REJECTED);
            assertThat(result.getCompletedAt()).isNotNull();
            assertThat(level1Decision.getDecision()).isEqualTo(DecisionStatus.REJECTED);
            verify(historyRepository).save(any(ApprovalHistory.class));
            verify(commentRepository).save(any(ApprovalComment.class));
            verify(quotationService).rejectQuotation(eq(100L), anyString());
        }

        @Test
        @DisplayName("should throw exception when rejecting without reason")
        void reject_WithoutReason_ThrowsException() {
            // When/Then - reason check is done before repository call
            assertThatThrownBy(() -> approvalService.reject(1L, 2L, null, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("reason");
        }

        @Test
        @DisplayName("should throw exception when reason is empty")
        void reject_EmptyReason_ThrowsException() {
            // When/Then - reason check is done before repository call
            assertThatThrownBy(() -> approvalService.reject(1L, 2L, "", null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("reason");
        }

        @Test
        @DisplayName("should throw exception when wrong user tries to reject")
        void reject_WrongUser_ThrowsAccessDenied() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));

            // When/Then
            assertThatThrownBy(() -> approvalService.reject(1L, 4L, "Reason", null))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("listPendingApprovals - T074: List pending approvals for user")
    class ListPendingApprovalsTests {

        @Test
        @DisplayName("should return pending approvals for Level 1 approver")
        void listPendingApprovals_Level1Approver_ReturnsPending() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<ApprovalRequest> page = new PageImpl<>(List.of(approvalRequest));

            given(approvalRequestRepository.findPendingByApproverUserId(eq(2L), any(Pageable.class)))
                    .willReturn(page);

            // When
            Page<ApprovalRequest> result = approvalService.listPendingApprovals(2L, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0)).isEqualTo(approvalRequest);
        }

        @Test
        @DisplayName("should return empty list when user is not current level approver")
        void listPendingApprovals_NotCurrentLevelApprover_ReturnsEmpty() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<ApprovalRequest> emptyPage = new PageImpl<>(List.of());

            // Level 2 approver queries when request is at Level 1
            given(approvalRequestRepository.findPendingByApproverUserId(eq(1L), any(Pageable.class)))
                    .willReturn(emptyPage);

            // When
            Page<ApprovalRequest> result = approvalService.listPendingApprovals(1L, pageable);

            // Then
            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("listAllApprovals - T074: List all approvals with filters")
    class ListAllApprovalsTests {

        @Test
        @DisplayName("should return all approvals for admin")
        void listAllApprovals_ReturnsAll() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<ApprovalRequest> page = new PageImpl<>(List.of(approvalRequest));

            given(approvalRequestRepository.findAllWithFilters(any(), any(), any()))
                    .willReturn(page);

            // When
            Page<ApprovalRequest> result = approvalService.listAllApprovals(null, null, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("should filter by entity type")
        void listAllApprovals_FilterByEntityType_ReturnsFiltered() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<ApprovalRequest> page = new PageImpl<>(List.of(approvalRequest));

            given(approvalRequestRepository.findAllWithFilters(eq(EntityType.QUOTATION), any(), any()))
                    .willReturn(page);

            // When
            Page<ApprovalRequest> result = approvalService.listAllApprovals(EntityType.QUOTATION, null, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            verify(approvalRequestRepository).findAllWithFilters(eq(EntityType.QUOTATION), any(), any());
        }
    }

    @Nested
    @DisplayName("getApprovalDetails - T074: Get approval with all level details")
    class GetApprovalDetailsTests {

        @Test
        @DisplayName("should return approval with level details")
        void getApprovalDetails_ReturnsWithLevels() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(1L)).willReturn(Optional.of(approvalRequest));

            // When
            ApprovalRequest result = approvalService.getApprovalDetails(1L);

            // Then
            assertThat(result).isEqualTo(approvalRequest);
            assertThat(result.getLevelDecisions()).hasSize(2);
        }

        @Test
        @DisplayName("should throw exception when not found")
        void getApprovalDetails_NotFound_ThrowsException() {
            // Given
            given(approvalRequestRepository.findByIdWithLevelDecisions(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> approvalService.getApprovalDetails(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getApprovalHistory - T074: Get approval history")
    class GetApprovalHistoryTests {

        @Test
        @DisplayName("should return approval history")
        void getApprovalHistory_ReturnsHistory() {
            // Given
            ApprovalHistory history = new ApprovalHistory();
            history.setId(1L);
            history.setApprovalRequest(approvalRequest);
            history.setAction(ApprovalAction.SUBMITTED);
            history.setActor(submitter);

            given(approvalRequestRepository.findById(1L)).willReturn(Optional.of(approvalRequest));
            given(historyRepository.findByApprovalRequestIdOrderByCreatedAtAsc(1L))
                    .willReturn(List.of(history));

            // When
            List<ApprovalHistory> result = approvalService.getApprovalHistory(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getAction()).isEqualTo(ApprovalAction.SUBMITTED);
        }
    }

    @Nested
    @DisplayName("Admin Chain Configuration - T074a")
    class AdminChainConfigTests {

        @Test
        @DisplayName("should list all chain templates")
        void listChainTemplates_ReturnsAll() {
            // Given
            ApprovalChainTemplate poTemplate = new ApprovalChainTemplate();
            poTemplate.setId(2L);
            poTemplate.setEntityType(EntityType.PURCHASE_ORDER);
            poTemplate.setName("발주서 결재");

            given(chainTemplateRepository.findAll()).willReturn(List.of(chainTemplate, poTemplate));

            // When
            List<ApprovalChainTemplate> result = approvalService.listChainTemplates();

            // Then
            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("should update chain levels successfully")
        void updateChainLevels_ValidData_UpdatesLevels() {
            // Given
            List<ChainLevelCommand> commands = List.of(
                    new ChainLevelCommand(1, "팀장", 2L, true),
                    new ChainLevelCommand(2, "부서장", 1L, true),
                    new ChainLevelCommand(3, "사장", 1L, false)
            );

            given(chainTemplateRepository.findById(1L)).willReturn(Optional.of(chainTemplate));
            given(userRepository.findById(2L)).willReturn(Optional.of(level1Approver));
            given(userRepository.findById(1L)).willReturn(Optional.of(level2Approver));
            given(chainTemplateRepository.save(any(ApprovalChainTemplate.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // When
            ApprovalChainTemplate result = approvalService.updateChainLevels(1L, commands);

            // Then
            assertThat(result).isNotNull();
            verify(chainLevelRepository).deleteAllByChainTemplateId(1L);
            verify(chainTemplateRepository).save(any(ApprovalChainTemplate.class));
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

            // When/Then
            assertThatThrownBy(() -> approvalService.updateChainLevels(1L, commands))
                    .isInstanceOf(BusinessException.class)
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
            given(userRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> approvalService.updateChainLevels(1L, commands))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
