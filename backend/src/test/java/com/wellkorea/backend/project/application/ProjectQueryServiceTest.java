package com.wellkorea.backend.project.application;

import com.wellkorea.backend.project.api.dto.query.ProjectDetailView;
import com.wellkorea.backend.project.api.dto.query.ProjectSummaryView;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.project.infrastructure.mapper.ProjectMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
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

    @InjectMocks
    private ProjectQueryService queryService;

    private Pageable pageable;
    private ProjectDetailView testDetailView;
    private ProjectSummaryView testSummaryView;

    @BeforeEach
    void setUp() {
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
                Instant.now()
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
}
