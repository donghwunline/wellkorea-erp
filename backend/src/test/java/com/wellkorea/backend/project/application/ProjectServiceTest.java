package com.wellkorea.backend.project.application;

import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.customer.infrastructure.repository.CustomerRepository;
import com.wellkorea.backend.project.api.dto.CreateProjectRequest;
import com.wellkorea.backend.project.api.dto.UpdateProjectRequest;
import com.wellkorea.backend.project.domain.JobCodeGenerator;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProjectService.
 * Tests business logic for project management operations.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService Unit Tests")
class ProjectServiceTest implements TestFixtures {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private JobCodeGenerator jobCodeGenerator;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectService projectService;

    private Project sampleProject;
    private CreateProjectRequest createRequest;
    private UpdateProjectRequest updateRequest;

    @BeforeEach
    void setUp() {
        sampleProject = Project.builder()
                .id(1L)
                .jobCode("WK2K25-0001-0115")
                .customerId(TEST_CUSTOMER_ID)
                .projectName("Test Project")
                .requesterName("John Doe")
                .dueDate(LocalDate.of(2025, 2, 15))
                .internalOwnerId(TEST_USER_ID)
                .status(ProjectStatus.DRAFT)
                .createdById(TEST_USER_ID)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .isDeleted(false)
                .build();

        createRequest = new CreateProjectRequest(
                TEST_CUSTOMER_ID,
                "New Project",
                "Jane Smith",
                LocalDate.of(2025, 3, 1),
                TEST_USER_ID
        );

        updateRequest = new UpdateProjectRequest(
                "Updated Project Name",
                "Updated Requester",
                LocalDate.of(2025, 4, 1),
                "ACTIVE"
        );
    }

    @Nested
    @DisplayName("createProject")
    class CreateProjectTests {

        @Test
        @DisplayName("should create project with generated JobCode")
        void createProject_ValidRequest_ReturnsCreatedProject() {
            when(customerRepository.existsByIdAndIsDeletedFalse(TEST_CUSTOMER_ID)).thenReturn(true);
            when(userRepository.existsByIdAndIsActiveTrue(TEST_USER_ID)).thenReturn(true);
            when(jobCodeGenerator.generateJobCode()).thenReturn("WK2K25-0002-0301");
            when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
                Project saved = invocation.getArgument(0);
                return saved.withId(2L);
            });

            Project result = projectService.createProject(createRequest, TEST_USER_ID);

            assertThat(result).isNotNull();
            assertThat(result.getJobCode()).isEqualTo("WK2K25-0002-0301");
            assertThat(result.getProjectName()).isEqualTo("New Project");
            assertThat(result.getRequesterName()).isEqualTo("Jane Smith");
            assertThat(result.getStatus()).isEqualTo(ProjectStatus.DRAFT);
            verify(projectRepository).save(any(Project.class));
        }

        @Test
        @DisplayName("should throw exception when customer does not exist")
        void createProject_CustomerNotExist_ThrowsBusinessException() {
            when(customerRepository.existsByIdAndIsDeletedFalse(TEST_CUSTOMER_ID)).thenReturn(false);

            assertThatThrownBy(() -> projectService.createProject(createRequest, TEST_USER_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Customer with ID " + TEST_CUSTOMER_ID + " does not exist");

            verify(projectRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when internal owner does not exist")
        void createProject_InternalOwnerNotExist_ThrowsBusinessException() {
            when(customerRepository.existsByIdAndIsDeletedFalse(TEST_CUSTOMER_ID)).thenReturn(true);
            when(userRepository.existsByIdAndIsActiveTrue(TEST_USER_ID)).thenReturn(false);

            assertThatThrownBy(() -> projectService.createProject(createRequest, TEST_USER_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("User with ID " + TEST_USER_ID + " does not exist");

            verify(projectRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getProject")
    class GetProjectTests {

        @Test
        @DisplayName("should return project when found")
        void getProject_ExistingId_ReturnsProject() {
            when(projectRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(sampleProject));

            Project result = projectService.getProject(1L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getJobCode()).isEqualTo("WK2K25-0001-0115");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when project not found")
        void getProject_NonExistingId_ThrowsResourceNotFoundException() {
            when(projectRepository.findByIdAndIsDeletedFalse(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> projectService.getProject(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getProjectByJobCode")
    class GetProjectByJobCodeTests {

        @Test
        @DisplayName("should return project when found by JobCode")
        void getProjectByJobCode_ExistingJobCode_ReturnsProject() {
            when(projectRepository.findByJobCode("WK2K25-0001-0115")).thenReturn(Optional.of(sampleProject));

            Project result = projectService.getProjectByJobCode("WK2K25-0001-0115");

            assertThat(result).isNotNull();
            assertThat(result.getJobCode()).isEqualTo("WK2K25-0001-0115");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when JobCode not found")
        void getProjectByJobCode_NonExistingJobCode_ThrowsResourceNotFoundException() {
            when(projectRepository.findByJobCode("WK2K25-9999-0101")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> projectService.getProjectByJobCode("WK2K25-9999-0101"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for deleted project")
        void getProjectByJobCode_DeletedProject_ThrowsResourceNotFoundException() {
            Project deletedProject = sampleProject.delete();
            when(projectRepository.findByJobCode("WK2K25-0001-0115")).thenReturn(Optional.of(deletedProject));

            assertThatThrownBy(() -> projectService.getProjectByJobCode("WK2K25-0001-0115"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("listProjects")
    class ListProjectsTests {

        @Test
        @DisplayName("should return paginated projects")
        void listProjects_ValidPageable_ReturnsPagedProjects() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Project> expectedPage = new PageImpl<>(List.of(sampleProject), pageable, 1);
            when(projectRepository.findByIsDeletedFalse(pageable)).thenReturn(expectedPage);

            Page<Project> result = projectService.listProjects(pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getJobCode()).isEqualTo("WK2K25-0001-0115");
        }
    }

    @Nested
    @DisplayName("listProjectsByStatus")
    class ListProjectsByStatusTests {

        @Test
        @DisplayName("should filter projects by status")
        void listProjectsByStatus_ValidStatus_ReturnsFilteredProjects() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Project> expectedPage = new PageImpl<>(List.of(sampleProject), pageable, 1);
            when(projectRepository.findByStatusAndIsDeletedFalse(ProjectStatus.DRAFT, pageable))
                    .thenReturn(expectedPage);

            Page<Project> result = projectService.listProjectsByStatus(ProjectStatus.DRAFT, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getStatus()).isEqualTo(ProjectStatus.DRAFT);
        }
    }

    @Nested
    @DisplayName("listProjectsByCustomers")
    class ListProjectsByCustomersTests {

        @Test
        @DisplayName("should return projects for specified customers")
        void listProjectsByCustomers_ValidCustomerIds_ReturnsProjects() {
            Pageable pageable = PageRequest.of(0, 10);
            List<Long> customerIds = List.of(1L, 2L);
            Page<Project> expectedPage = new PageImpl<>(List.of(sampleProject), pageable, 1);
            when(projectRepository.findByCustomerIdInAndIsDeletedFalse(customerIds, pageable))
                    .thenReturn(expectedPage);

            Page<Project> result = projectService.listProjectsByCustomers(customerIds, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("should return empty page for empty customer list")
        void listProjectsByCustomers_EmptyCustomerIds_ReturnsEmptyPage() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<Project> result = projectService.listProjectsByCustomers(List.of(), pageable);

            assertThat(result).isEmpty();
            verify(projectRepository, never()).findByCustomerIdInAndIsDeletedFalse(any(), any());
        }

        @Test
        @DisplayName("should return empty page for null customer list")
        void listProjectsByCustomers_NullCustomerIds_ReturnsEmptyPage() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<Project> result = projectService.listProjectsByCustomers(null, pageable);

            assertThat(result).isEmpty();
            verify(projectRepository, never()).findByCustomerIdInAndIsDeletedFalse(any(), any());
        }
    }

    @Nested
    @DisplayName("listProjectsByCustomersAndStatus")
    class ListProjectsByCustomersAndStatusTests {

        @Test
        @DisplayName("should filter by customers and status")
        void listProjectsByCustomersAndStatus_ValidFilters_ReturnsFilteredProjects() {
            Pageable pageable = PageRequest.of(0, 10);
            List<Long> customerIds = List.of(1L);
            Page<Project> expectedPage = new PageImpl<>(List.of(sampleProject), pageable, 1);
            when(projectRepository.findByCustomerIdInAndStatusAndIsDeletedFalse(
                    customerIds, ProjectStatus.DRAFT, pageable)).thenReturn(expectedPage);

            Page<Project> result = projectService.listProjectsByCustomersAndStatus(
                    customerIds, ProjectStatus.DRAFT, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("should return empty page for empty customer list with status filter")
        void listProjectsByCustomersAndStatus_EmptyCustomerIds_ReturnsEmptyPage() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<Project> result = projectService.listProjectsByCustomersAndStatus(
                    List.of(), ProjectStatus.DRAFT, pageable);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("searchProjects")
    class SearchProjectsTests {

        @Test
        @DisplayName("should search by JobCode or project name")
        void searchProjects_ValidSearchTerm_ReturnsMatchingProjects() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Project> expectedPage = new PageImpl<>(List.of(sampleProject), pageable, 1);
            when(projectRepository.searchByJobCodeOrProjectName("Test", pageable))
                    .thenReturn(expectedPage);

            Page<Project> result = projectService.searchProjects("Test", pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("should return all projects for blank search term")
        void searchProjects_BlankSearchTerm_ReturnsAllProjects() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Project> expectedPage = new PageImpl<>(List.of(sampleProject), pageable, 1);
            when(projectRepository.findByIsDeletedFalse(pageable)).thenReturn(expectedPage);

            Page<Project> result = projectService.searchProjects("   ", pageable);

            assertThat(result).isNotNull();
            verify(projectRepository).findByIsDeletedFalse(pageable);
            verify(projectRepository, never()).searchByJobCodeOrProjectName(any(), any());
        }

        @Test
        @DisplayName("should return all projects for null search term")
        void searchProjects_NullSearchTerm_ReturnsAllProjects() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Project> expectedPage = new PageImpl<>(List.of(sampleProject), pageable, 1);
            when(projectRepository.findByIsDeletedFalse(pageable)).thenReturn(expectedPage);

            Page<Project> result = projectService.searchProjects(null, pageable);

            assertThat(result).isNotNull();
            verify(projectRepository).findByIsDeletedFalse(pageable);
        }
    }

    @Nested
    @DisplayName("updateProject")
    class UpdateProjectTests {

        @Test
        @DisplayName("should update project with valid request")
        void updateProject_ValidRequest_ReturnsUpdatedProject() {
            when(projectRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(sampleProject));
            when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Project result = projectService.updateProject(1L, updateRequest);

            assertThat(result).isNotNull();
            assertThat(result.getProjectName()).isEqualTo("Updated Project Name");
            assertThat(result.getRequesterName()).isEqualTo("Updated Requester");
            assertThat(result.getStatus()).isEqualTo(ProjectStatus.ACTIVE);
            verify(projectRepository).save(any(Project.class));
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for non-existing project")
        void updateProject_NonExistingProject_ThrowsResourceNotFoundException() {
            when(projectRepository.findByIdAndIsDeletedFalse(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> projectService.updateProject(999L, updateRequest))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(projectRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessException for non-editable project")
        void updateProject_NonEditableProject_ThrowsBusinessException() {
            Project archivedProject = Project.builder()
                    .id(1L)
                    .jobCode("WK2K25-0001-0115")
                    .customerId(TEST_CUSTOMER_ID)
                    .projectName("Archived Project")
                    .dueDate(LocalDate.of(2025, 2, 15))
                    .internalOwnerId(TEST_USER_ID)
                    .status(ProjectStatus.ARCHIVED)
                    .createdById(TEST_USER_ID)
                    .build();

            when(projectRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(archivedProject));

            assertThatThrownBy(() -> projectService.updateProject(1L, updateRequest))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("cannot be edited");

            verify(projectRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessException for invalid status")
        void updateProject_InvalidStatus_ThrowsBusinessException() {
            UpdateProjectRequest invalidStatusRequest = new UpdateProjectRequest(
                    "Updated Name",
                    null,
                    null,
                    "INVALID_STATUS"
            );

            when(projectRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(sampleProject));

            assertThatThrownBy(() -> projectService.updateProject(1L, invalidStatusRequest))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Invalid status");

            verify(projectRepository, never()).save(any());
        }

        @Test
        @DisplayName("should update with partial fields")
        void updateProject_PartialUpdate_UpdatesOnlyProvidedFields() {
            UpdateProjectRequest partialRequest = new UpdateProjectRequest(
                    "Only Name Updated",
                    null,
                    null,
                    null
            );

            when(projectRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(sampleProject));
            when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Project result = projectService.updateProject(1L, partialRequest);

            assertThat(result.getProjectName()).isEqualTo("Only Name Updated");
            assertThat(result.getRequesterName()).isEqualTo("John Doe"); // Original value
            assertThat(result.getStatus()).isEqualTo(ProjectStatus.DRAFT); // Original value
        }
    }

    @Nested
    @DisplayName("deleteProject")
    class DeleteProjectTests {

        @Test
        @DisplayName("should soft delete project")
        void deleteProject_ExistingProject_SoftDeletes() {
            when(projectRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(sampleProject));
            when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

            projectService.deleteProject(1L);

            verify(projectRepository).save(argThat(project -> project.isDeleted()));
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for non-existing project")
        void deleteProject_NonExistingProject_ThrowsResourceNotFoundException() {
            when(projectRepository.findByIdAndIsDeletedFalse(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> projectService.deleteProject(999L))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(projectRepository, never()).save(any());
        }
    }
}
