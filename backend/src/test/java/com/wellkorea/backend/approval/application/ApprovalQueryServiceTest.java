package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.approval.api.dto.query.*;
import com.wellkorea.backend.approval.domain.ApprovalAction;
import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.DecisionStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.approval.infrastructure.mapper.ApprovalMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for ApprovalQueryService.
 * Tests read operations for approval queries with mocked MyBatis mapper.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalQueryService Unit Tests")
@Tag("unit")
class ApprovalQueryServiceTest {

    @Mock
    private ApprovalMapper approvalMapper;

    @InjectMocks
    private ApprovalQueryService queryService;

    private Pageable pageable;
    private ApprovalDetailView testDetailView;
    private ApprovalSummaryView testSummaryView;
    private ApprovalHistoryView testHistoryView;
    private ChainTemplateView testChainTemplateView;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        LevelDecisionView levelDecision = new LevelDecisionView(
                1,
                "Manager Approval",
                2L,
                "Manager User",
                DecisionStatus.PENDING,
                null,
                null,
                null,
                null
        );

        testDetailView = new ApprovalDetailView(
                1L,
                EntityType.QUOTATION,
                100L,
                "Quotation #100 - Test Project",
                1,
                2,
                ApprovalStatus.PENDING,
                1L,
                "Sales User",
                LocalDateTime.now(),
                null,
                LocalDateTime.now(),
                List.of(levelDecision)
        );

        testSummaryView = new ApprovalSummaryView(
                1L,
                EntityType.QUOTATION,
                100L,
                "Quotation #100 - Test Project",
                1,
                2,
                ApprovalStatus.PENDING,
                1L,
                "Sales User",
                LocalDateTime.now(),
                null,
                LocalDateTime.now()
        );

        // ApprovalAction enum uses SUBMITTED (not SUBMIT)
        testHistoryView = new ApprovalHistoryView(
                1L,
                1,
                ApprovalAction.SUBMITTED,
                1L,
                "Sales User",
                "Submitted for approval",
                LocalDateTime.now()
        );

        ChainLevelView chainLevel = new ChainLevelView(
                1,
                "Manager Approval",
                2L,
                "Manager User",
                true
        );

        testChainTemplateView = new ChainTemplateView(
                1L,
                EntityType.QUOTATION,
                "Default Quotation Approval",
                "Standard approval chain for quotations",
                true,
                LocalDateTime.now(),
                List.of(chainLevel)
        );
    }

    @Nested
    @DisplayName("getApprovalDetail - Get approval detail by ID")
    class GetApprovalDetailTests {

        @Test
        @DisplayName("should return detail view with level decisions when exists")
        void getApprovalDetail_ApprovalExists_ReturnsDetailView() {
            // Given
            given(approvalMapper.findDetailById(1L)).willReturn(Optional.of(testDetailView));

            // When
            ApprovalDetailView result = queryService.getApprovalDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.entityType()).isEqualTo(EntityType.QUOTATION);
            assertThat(result.status()).isEqualTo(ApprovalStatus.PENDING);
            assertThat(result.levels()).hasSize(1);
            assertThat(result.levels().get(0).levelName()).isEqualTo("Manager Approval");
            verify(approvalMapper).findDetailById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when not found")
        void getApprovalDetail_ApprovalNotFound_ThrowsException() {
            // Given
            given(approvalMapper.findDetailById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getApprovalDetail(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Approval request")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("listPendingApprovals - List pending approvals for user")
    class ListPendingApprovalsTests {

        @Test
        @DisplayName("should return paginated pending approvals for user")
        void listPendingApprovals_ForUser_ReturnsPage() {
            // Given
            List<ApprovalSummaryView> content = List.of(testSummaryView);
            given(approvalMapper.findPendingByApproverUserId(2L, 10, 0L)).willReturn(content);
            given(approvalMapper.countPendingByApproverUserId(2L)).willReturn(1L);

            // When
            Page<ApprovalSummaryView> result = queryService.listPendingApprovals(2L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            verify(approvalMapper).findPendingByApproverUserId(2L, 10, 0L);
        }

        @Test
        @DisplayName("should return empty page when no pending approvals")
        void listPendingApprovals_NoPending_ReturnsEmptyPage() {
            // Given
            given(approvalMapper.findPendingByApproverUserId(2L, 10, 0L)).willReturn(List.of());
            given(approvalMapper.countPendingByApproverUserId(2L)).willReturn(0L);

            // When
            Page<ApprovalSummaryView> result = queryService.listPendingApprovals(2L, pageable);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("listAllApprovals - List all approvals with filters")
    class ListAllApprovalsTests {

        @Test
        @DisplayName("should filter by entityType and status")
        void listAllApprovals_WithFilters_ReturnsFilteredPage() {
            // Given
            List<ApprovalSummaryView> content = List.of(testSummaryView);
            given(approvalMapper.findAllWithFilters(EntityType.QUOTATION, ApprovalStatus.PENDING, 10, 0L))
                    .willReturn(content);
            given(approvalMapper.countWithFilters(EntityType.QUOTATION, ApprovalStatus.PENDING)).willReturn(1L);

            // When
            Page<ApprovalSummaryView> result = queryService.listAllApprovals(
                    EntityType.QUOTATION, ApprovalStatus.PENDING, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).entityType()).isEqualTo(EntityType.QUOTATION);
            verify(approvalMapper).findAllWithFilters(EntityType.QUOTATION, ApprovalStatus.PENDING, 10, 0L);
        }

        @Test
        @DisplayName("should return all when filters are null")
        void listAllApprovals_NullFilters_ReturnsAllPage() {
            // Given
            List<ApprovalSummaryView> content = List.of(testSummaryView);
            given(approvalMapper.findAllWithFilters(null, null, 10, 0L)).willReturn(content);
            given(approvalMapper.countWithFilters(null, null)).willReturn(1L);

            // When
            Page<ApprovalSummaryView> result = queryService.listAllApprovals(null, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(approvalMapper).findAllWithFilters(null, null, 10, 0L);
        }
    }

    @Nested
    @DisplayName("getApprovalHistory - Get approval history by request ID")
    class GetApprovalHistoryTests {

        @Test
        @DisplayName("should return history entries when request exists")
        void getApprovalHistory_RequestExists_ReturnsHistory() {
            // Given
            given(approvalMapper.existsById(1L)).willReturn(true);
            given(approvalMapper.findHistoryByRequestId(1L)).willReturn(List.of(testHistoryView));

            // When
            List<ApprovalHistoryView> result = queryService.getApprovalHistory(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).action()).isEqualTo(ApprovalAction.SUBMITTED);
            assertThat(result.get(0).actorName()).isEqualTo("Sales User");
            verify(approvalMapper).existsById(1L);
            verify(approvalMapper).findHistoryByRequestId(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when request not found")
        void getApprovalHistory_RequestNotFound_ThrowsException() {
            // Given
            given(approvalMapper.existsById(999L)).willReturn(false);

            // When/Then
            assertThatThrownBy(() -> queryService.getApprovalHistory(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Approval request")
                    .hasMessageContaining("999");

            verify(approvalMapper, never()).findHistoryByRequestId(anyLong());
        }
    }

    @Nested
    @DisplayName("listChainTemplates - List all chain templates")
    class ListChainTemplatesTests {

        @Test
        @DisplayName("should return all chain templates")
        void listChainTemplates_ReturnsAllTemplates() {
            // Given
            given(approvalMapper.findAllChainTemplates()).willReturn(List.of(testChainTemplateView));

            // When
            List<ChainTemplateView> result = queryService.listChainTemplates();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Default Quotation Approval");
            assertThat(result.get(0).levels()).hasSize(1);
            verify(approvalMapper).findAllChainTemplates();
        }

        @Test
        @DisplayName("should return empty list when no templates")
        void listChainTemplates_NoTemplates_ReturnsEmptyList() {
            // Given
            given(approvalMapper.findAllChainTemplates()).willReturn(List.of());

            // When
            List<ChainTemplateView> result = queryService.listChainTemplates();

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getChainTemplate - Get chain template by ID")
    class GetChainTemplateTests {

        @Test
        @DisplayName("should return template when exists")
        void getChainTemplate_TemplateExists_ReturnsTemplate() {
            // Given
            given(approvalMapper.findChainTemplateById(1L)).willReturn(Optional.of(testChainTemplateView));

            // When
            ChainTemplateView result = queryService.getChainTemplate(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.entityType()).isEqualTo(EntityType.QUOTATION);
            assertThat(result.levels()).hasSize(1);
            verify(approvalMapper).findChainTemplateById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when not found")
        void getChainTemplate_TemplateNotFound_ThrowsException() {
            // Given
            given(approvalMapper.findChainTemplateById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getChainTemplate(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Chain template")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("exists - Check if approval request exists")
    class ExistsTests {

        @Test
        @DisplayName("should delegate to mapper and return true when exists")
        void exists_RequestExists_ReturnsTrue() {
            // Given
            given(approvalMapper.existsById(1L)).willReturn(true);

            // When
            boolean result = queryService.exists(1L);

            // Then
            assertThat(result).isTrue();
            verify(approvalMapper).existsById(1L);
        }

        @Test
        @DisplayName("should delegate to mapper and return false when not exists")
        void exists_RequestNotExists_ReturnsFalse() {
            // Given
            given(approvalMapper.existsById(999L)).willReturn(false);

            // When
            boolean result = queryService.exists(999L);

            // Then
            assertThat(result).isFalse();
            verify(approvalMapper).existsById(999L);
        }
    }
}
