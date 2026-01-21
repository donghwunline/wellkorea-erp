package com.wellkorea.backend.project.application;

import com.wellkorea.backend.delivery.infrastructure.mapper.DeliveryMapper;
import com.wellkorea.backend.invoice.infrastructure.mapper.InvoiceMapper;
import com.wellkorea.backend.production.domain.TaskFlow;
import com.wellkorea.backend.production.domain.TaskNode;
import com.wellkorea.backend.production.infrastructure.persistence.BlueprintAttachmentRepository;
import com.wellkorea.backend.production.infrastructure.persistence.TaskFlowRepository;
import com.wellkorea.backend.project.api.dto.query.ProjectDetailView;
import com.wellkorea.backend.project.api.dto.query.ProjectSectionsSummaryView;
import com.wellkorea.backend.project.api.dto.query.ProjectSummaryView;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.project.infrastructure.mapper.ProjectMapper;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseRequestMapper;
import com.wellkorea.backend.quotation.infrastructure.mapper.QuotationMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for ProjectQueryService.
 * Tests read operations for project queries with mocked MyBatis mapper.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectQueryService Unit Tests")
@Tag("unit")
class ProjectQueryServiceTest {

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private QuotationMapper quotationMapper;

    @Mock
    private TaskFlowRepository taskFlowRepository;

    @Mock
    private PurchaseRequestMapper purchaseRequestMapper;

    @Mock
    private BlueprintAttachmentRepository blueprintAttachmentRepository;

    @Mock
    private DeliveryMapper deliveryMapper;

    @Mock
    private InvoiceMapper invoiceMapper;

    private ProjectQueryService queryService;

    private Pageable pageable;
    private ProjectDetailView testDetailView;
    private ProjectSummaryView testSummaryView;

    @BeforeEach
    void setUp() {
        queryService = new ProjectQueryService(
                projectMapper,
                quotationMapper,
                taskFlowRepository,
                purchaseRequestMapper,
                blueprintAttachmentRepository,
                deliveryMapper,
                invoiceMapper
        );
        pageable = PageRequest.of(0, 10);

        testDetailView = new ProjectDetailView(
                1L,
                "WK2K25-0001-1219",
                1L,
                "ACME Corp",
                "Test Project",
                "John Requester",
                LocalDate.now().plusMonths(1),
                2L,
                "Jane Owner",
                ProjectStatus.ACTIVE,
                3L,
                "Admin User",
                Instant.now(),
                Instant.now(),
                "contents"
        );

        testSummaryView = new ProjectSummaryView(
                1L,
                "WK2K25-0001-1219",
                1L,
                "ACME Corp",
                "Test Project",
                LocalDate.now().plusMonths(1),
                ProjectStatus.ACTIVE,
                Instant.now(),
                Instant.now()
        );
    }

    @Nested
    @DisplayName("getProjectDetail - Get project detail by ID")
    class GetProjectDetailTests {

        @Test
        @DisplayName("should return detail view when project exists")
        void getProjectDetail_ProjectExists_ReturnsDetailView() {
            // Given
            given(projectMapper.findDetailById(1L)).willReturn(Optional.of(testDetailView));

            // When
            ProjectDetailView result = queryService.getProjectDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.jobCode()).isEqualTo("WK2K25-0001-1219");
            assertThat(result.customerName()).isEqualTo("ACME Corp");
            assertThat(result.projectName()).isEqualTo("Test Project");
            verify(projectMapper).findDetailById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when project not found")
        void getProjectDetail_ProjectNotFound_ThrowsException() {
            // Given
            given(projectMapper.findDetailById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getProjectDetail(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Project")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("getProjectDetailByJobCode - Get project detail by JobCode")
    class GetProjectDetailByJobCodeTests {

        @Test
        @DisplayName("should return detail view when jobCode exists")
        void getProjectDetailByJobCode_JobCodeExists_ReturnsDetailView() {
            // Given
            String jobCode = "WK2K25-0001-1219";
            given(projectMapper.findDetailByJobCode(jobCode)).willReturn(Optional.of(testDetailView));

            // When
            ProjectDetailView result = queryService.getProjectDetailByJobCode(jobCode);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.jobCode()).isEqualTo(jobCode);
            verify(projectMapper).findDetailByJobCode(jobCode);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when jobCode not found")
        void getProjectDetailByJobCode_JobCodeNotFound_ThrowsException() {
            // Given
            String jobCode = "NONEXISTENT";
            given(projectMapper.findDetailByJobCode(jobCode)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getProjectDetailByJobCode(jobCode))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("JobCode");
        }
    }

    @Nested
    @DisplayName("listProjects - List all projects")
    class ListProjectsTests {

        @Test
        @DisplayName("should return paginated results")
        void listProjects_WithPagination_ReturnsPage() {
            // Given
            List<ProjectSummaryView> content = List.of(testSummaryView);
            given(projectMapper.findWithFilters(null, null, null, 10, 0L)).willReturn(content);
            given(projectMapper.countWithFilters(null, null, null)).willReturn(1L);

            // When
            Page<ProjectSummaryView> result = queryService.listProjects(pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            assertThat(result.getTotalPages()).isEqualTo(1);
            assertThat(result.getNumber()).isEqualTo(0);
        }

        @Test
        @DisplayName("should return empty page when no results")
        void listProjects_NoResults_ReturnsEmptyPage() {
            // Given
            given(projectMapper.findWithFilters(null, null, null, 10, 0L)).willReturn(List.of());
            given(projectMapper.countWithFilters(null, null, null)).willReturn(0L);

            // When
            Page<ProjectSummaryView> result = queryService.listProjects(pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("listProjectsByStatus - List projects by status")
    class ListProjectsByStatusTests {

        @Test
        @DisplayName("should filter by status and return paginated results")
        void listProjectsByStatus_WithStatus_ReturnsFilteredPage() {
            // Given
            List<ProjectSummaryView> content = List.of(testSummaryView);
            given(projectMapper.findWithFilters(ProjectStatus.ACTIVE, null, null, 10, 0L)).willReturn(content);
            given(projectMapper.countWithFilters(ProjectStatus.ACTIVE, null, null)).willReturn(1L);

            // When
            Page<ProjectSummaryView> result = queryService.listProjectsByStatus(ProjectStatus.ACTIVE, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(projectMapper).findWithFilters(ProjectStatus.ACTIVE, null, null, 10, 0L);
        }
    }

    @Nested
    @DisplayName("listProjectsByCustomers - List projects for specific customers")
    class ListProjectsByCustomersTests {

        @Test
        @DisplayName("should filter by customer IDs")
        void listProjectsByCustomers_WithCustomerIds_ReturnsFilteredPage() {
            // Given
            List<Long> customerIds = List.of(1L, 2L);
            List<ProjectSummaryView> content = List.of(testSummaryView);
            given(projectMapper.findWithFilters(null, customerIds, null, 10, 0L)).willReturn(content);
            given(projectMapper.countWithFilters(null, customerIds, null)).willReturn(1L);

            // When
            Page<ProjectSummaryView> result = queryService.listProjectsByCustomers(customerIds, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(projectMapper).findWithFilters(null, customerIds, null, 10, 0L);
        }

        @Test
        @DisplayName("should return empty page when customerIds is null")
        void listProjectsByCustomers_NullCustomerIds_ReturnsEmptyPage() {
            // When
            Page<ProjectSummaryView> result = queryService.listProjectsByCustomers(null, pageable);

            // Then
            assertThat(result).isEmpty();
            verify(projectMapper, never()).findWithFilters(any(), any(), any(), anyInt(), anyLong());
        }

        @Test
        @DisplayName("should return empty page when customerIds is empty")
        void listProjectsByCustomers_EmptyCustomerIds_ReturnsEmptyPage() {
            // When
            Page<ProjectSummaryView> result = queryService.listProjectsByCustomers(List.of(), pageable);

            // Then
            assertThat(result).isEmpty();
            verify(projectMapper, never()).findWithFilters(any(), any(), any(), anyInt(), anyLong());
        }
    }

    @Nested
    @DisplayName("listProjectsByCustomersAndStatus - List projects for customers with status")
    class ListProjectsByCustomersAndStatusTests {

        @Test
        @DisplayName("should filter by customer IDs and status")
        void listProjectsByCustomersAndStatus_WithBothFilters_ReturnsFilteredPage() {
            // Given
            List<Long> customerIds = List.of(1L);
            List<ProjectSummaryView> content = List.of(testSummaryView);
            given(projectMapper.findWithFilters(ProjectStatus.ACTIVE, customerIds, null, 10, 0L)).willReturn(content);
            given(projectMapper.countWithFilters(ProjectStatus.ACTIVE, customerIds, null)).willReturn(1L);

            // When
            Page<ProjectSummaryView> result = queryService.listProjectsByCustomersAndStatus(
                    customerIds, ProjectStatus.ACTIVE, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(projectMapper).findWithFilters(ProjectStatus.ACTIVE, customerIds, null, 10, 0L);
        }

        @Test
        @DisplayName("should return empty page when customerIds is null")
        void listProjectsByCustomersAndStatus_NullCustomerIds_ReturnsEmptyPage() {
            // When
            Page<ProjectSummaryView> result = queryService.listProjectsByCustomersAndStatus(
                    null, ProjectStatus.ACTIVE, pageable);

            // Then
            assertThat(result).isEmpty();
            verify(projectMapper, never()).findWithFilters(any(), any(), any(), anyInt(), anyLong());
        }
    }

    @Nested
    @DisplayName("searchProjects - Search projects by JobCode or name")
    class SearchProjectsTests {

        @Test
        @DisplayName("should trim and search by term")
        void searchProjects_WithSearchTerm_ReturnsFilteredPage() {
            // Given
            List<ProjectSummaryView> content = List.of(testSummaryView);
            given(projectMapper.findWithFilters(null, null, "test", 10, 0L)).willReturn(content);
            given(projectMapper.countWithFilters(null, null, "test")).willReturn(1L);

            // When
            Page<ProjectSummaryView> result = queryService.searchProjects("  test  ", pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(projectMapper).findWithFilters(null, null, "test", 10, 0L);
        }

        @Test
        @DisplayName("should handle null search term")
        void searchProjects_NullSearchTerm_PassesNullToMapper() {
            // Given
            given(projectMapper.findWithFilters(null, null, null, 10, 0L)).willReturn(List.of());
            given(projectMapper.countWithFilters(null, null, null)).willReturn(0L);

            // When
            Page<ProjectSummaryView> result = queryService.searchProjects(null, pageable);

            // Then
            assertThat(result).isEmpty();
            verify(projectMapper).findWithFilters(null, null, null, 10, 0L);
        }

        @Test
        @DisplayName("should handle blank search term")
        void searchProjects_BlankSearchTerm_PassesNullToMapper() {
            // Given
            given(projectMapper.findWithFilters(null, null, null, 10, 0L)).willReturn(List.of());
            given(projectMapper.countWithFilters(null, null, null)).willReturn(0L);

            // When
            Page<ProjectSummaryView> result = queryService.searchProjects("   ", pageable);

            // Then
            assertThat(result).isEmpty();
            verify(projectMapper).findWithFilters(null, null, null, 10, 0L);
        }
    }

    @Nested
    @DisplayName("getProjectSummary - Get project sections summary")
    class GetProjectSummaryTests {

        @Test
        @DisplayName("should return summary with all section counts when project exists")
        void getProjectSummary_ProjectExists_ReturnsSectionsWithCounts() {
            // Given
            Long projectId = 1L;
            given(projectMapper.findDetailById(projectId)).willReturn(Optional.of(testDetailView));
            given(quotationMapper.countWithFilters(null, projectId)).willReturn(3L);
            given(taskFlowRepository.findByProjectId(projectId)).willReturn(Optional.empty());
            given(purchaseRequestMapper.countWithFilters(null, projectId, "MATERIAL")).willReturn(5L);
            given(purchaseRequestMapper.countWithFilters(null, projectId, "SERVICE")).willReturn(2L);
            given(blueprintAttachmentRepository.findByProjectId(projectId)).willReturn(List.of());
            given(deliveryMapper.countWithFilters(projectId, null)).willReturn(4L);
            given(invoiceMapper.countWithFilters(projectId, null)).willReturn(1L);

            // When
            ProjectSectionsSummaryView result = queryService.getProjectSummary(projectId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.projectId()).isEqualTo(projectId);
            assertThat(result.sections()).hasSize(7);

            // Verify quotation section
            var quotationSection = result.sections().stream()
                    .filter(s -> s.section().equals("quotation"))
                    .findFirst().orElseThrow();
            assertThat(quotationSection.totalCount()).isEqualTo(3);
            assertThat(quotationSection.label()).isEqualTo("견적");

            // Verify process section (no task flow)
            var processSection = result.sections().stream()
                    .filter(s -> s.section().equals("process"))
                    .findFirst().orElseThrow();
            assertThat(processSection.totalCount()).isEqualTo(0);
            assertThat(processSection.label()).isEqualTo("공정");

            // Verify purchase section
            var purchaseSection = result.sections().stream()
                    .filter(s -> s.section().equals("purchase"))
                    .findFirst().orElseThrow();
            assertThat(purchaseSection.totalCount()).isEqualTo(5);
            assertThat(purchaseSection.label()).isEqualTo("구매");

            // Verify outsource section
            var outsourceSection = result.sections().stream()
                    .filter(s -> s.section().equals("outsource"))
                    .findFirst().orElseThrow();
            assertThat(outsourceSection.totalCount()).isEqualTo(2);
            assertThat(outsourceSection.label()).isEqualTo("외주");

            // Verify delivery section
            var deliverySection = result.sections().stream()
                    .filter(s -> s.section().equals("delivery"))
                    .findFirst().orElseThrow();
            assertThat(deliverySection.totalCount()).isEqualTo(4);
            assertThat(deliverySection.label()).isEqualTo("출고");

            // Verify finance section
            var financeSection = result.sections().stream()
                    .filter(s -> s.section().equals("finance"))
                    .findFirst().orElseThrow();
            assertThat(financeSection.totalCount()).isEqualTo(1);
            assertThat(financeSection.label()).isEqualTo("정산");
        }

        @Test
        @DisplayName("should count nodes when task flow exists")
        void getProjectSummary_WithTaskFlow_ReturnsNodeCount() {
            // Given
            Long projectId = 1L;
            TaskFlow taskFlow = new TaskFlow();
            Set<TaskNode> nodes = new HashSet<>();
            // TaskNode(nodeId, title, assignee, deadline, progress, positionX, positionY)
            nodes.add(new TaskNode("node1", "Task 1", "User1", null, 0, 0.0, 0.0));
            nodes.add(new TaskNode("node2", "Task 2", "User2", null, 50, 100.0, 0.0));
            nodes.add(new TaskNode("node3", "Task 3", "User3", null, 100, 200.0, 0.0));
            taskFlow.setNodes(nodes);

            given(projectMapper.findDetailById(projectId)).willReturn(Optional.of(testDetailView));
            given(quotationMapper.countWithFilters(null, projectId)).willReturn(0L);
            given(taskFlowRepository.findByProjectId(projectId)).willReturn(Optional.of(taskFlow));
            given(purchaseRequestMapper.countWithFilters(null, projectId, "MATERIAL")).willReturn(0L);
            given(purchaseRequestMapper.countWithFilters(null, projectId, "SERVICE")).willReturn(0L);
            given(blueprintAttachmentRepository.findByProjectId(projectId)).willReturn(List.of());
            given(deliveryMapper.countWithFilters(projectId, null)).willReturn(0L);
            given(invoiceMapper.countWithFilters(projectId, null)).willReturn(0L);

            // When
            ProjectSectionsSummaryView result = queryService.getProjectSummary(projectId);

            // Then
            var processSection = result.sections().stream()
                    .filter(s -> s.section().equals("process"))
                    .findFirst().orElseThrow();
            assertThat(processSection.totalCount()).isEqualTo(3);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when project not found")
        void getProjectSummary_ProjectNotFound_ThrowsException() {
            // Given
            given(projectMapper.findDetailById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getProjectSummary(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Project")
                    .hasMessageContaining("999");
        }
    }
}
