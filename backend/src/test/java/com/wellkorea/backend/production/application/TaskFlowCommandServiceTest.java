package com.wellkorea.backend.production.application;

import com.wellkorea.backend.production.api.dto.command.SaveTaskFlowRequest;
import com.wellkorea.backend.production.domain.TaskFlow;
import com.wellkorea.backend.production.domain.TaskNode;
import com.wellkorea.backend.production.domain.TaskEdge;
import com.wellkorea.backend.production.infrastructure.persistence.TaskFlowRepository;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for TaskFlowCommandService.
 * Tests business logic for task flow creation and saving.
 * Following CQRS pattern - command service returns IDs, not entities.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TaskFlowCommandService Unit Tests")
@Tag("unit")
class TaskFlowCommandServiceTest {

    @Mock
    private TaskFlowRepository taskFlowRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private TaskFlowCommandService commandService;

    private Project testProject;
    private TaskFlow testTaskFlow;

    @BeforeEach
    void setUp() {
        // Set up test project
        testProject = Project.builder()
                .id(1L)
                .jobCode("WK2K25-0001-0107")
                .projectName("Test Project")
                .customerId(1L)
                .internalOwnerId(1L)
                .createdById(1L)
                .dueDate(LocalDate.now().plusMonths(1))
                .status(ProjectStatus.ACTIVE)
                .build();

        // Set up test task flow
        testTaskFlow = new TaskFlow();
        testTaskFlow.setId(1L);
        testTaskFlow.setProject(testProject);
    }

    @Nested
    @DisplayName("createTaskFlow - Create new task flow for project")
    class CreateTaskFlowTests {

        @Test
        @DisplayName("should create new task flow and return ID")
        void createTaskFlow_ValidProject_ReturnsId() {
            // Given
            given(taskFlowRepository.existsByProjectId(1L)).willReturn(false);
            given(projectRepository.findById(1L)).willReturn(Optional.of(testProject));
            given(taskFlowRepository.save(any(TaskFlow.class))).willAnswer(invocation -> {
                TaskFlow flow = invocation.getArgument(0);
                flow.setId(1L);
                return flow;
            });

            // When
            Long result = commandService.createTaskFlow(1L);

            // Then
            assertThat(result).isEqualTo(1L);
            ArgumentCaptor<TaskFlow> flowCaptor = ArgumentCaptor.forClass(TaskFlow.class);
            verify(taskFlowRepository).save(flowCaptor.capture());
            assertThat(flowCaptor.getValue().getProject()).isEqualTo(testProject);
        }

        @Test
        @DisplayName("should return existing flow ID when flow already exists (idempotency)")
        void createTaskFlow_FlowExists_ReturnsExistingId() {
            // Given
            given(taskFlowRepository.existsByProjectId(1L)).willReturn(true);
            given(taskFlowRepository.findByProjectId(1L)).willReturn(Optional.of(testTaskFlow));

            // When
            Long result = commandService.createTaskFlow(1L);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(taskFlowRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when project not found")
        void createTaskFlow_ProjectNotFound_ThrowsException() {
            // Given
            given(taskFlowRepository.existsByProjectId(999L)).willReturn(false);
            given(projectRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> commandService.createTaskFlow(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Project");
        }
    }

    @Nested
    @DisplayName("saveTaskFlow - Save task flow with nodes and edges")
    class SaveTaskFlowTests {

        @Test
        @DisplayName("should save task flow with nodes and edges")
        void saveTaskFlow_ValidData_ReturnsId() {
            // Given
            SaveTaskFlowRequest request = new SaveTaskFlowRequest(
                    List.of(
                            new SaveTaskFlowRequest.NodeData(
                                    "node-1", "Design", "Alice", LocalDate.now().plusDays(7), 50, 100.0, 100.0
                            ),
                            new SaveTaskFlowRequest.NodeData(
                                    "node-2", "Implementation", "Bob", LocalDate.now().plusDays(14), 0, 300.0, 100.0
                            )
                    ),
                    List.of(
                            new SaveTaskFlowRequest.EdgeData("edge-1", "node-1", "node-2")
                    )
            );

            given(taskFlowRepository.findById(1L)).willReturn(Optional.of(testTaskFlow));
            given(taskFlowRepository.save(any(TaskFlow.class))).willReturn(testTaskFlow);

            // When
            Long result = commandService.saveTaskFlow(1L, request);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(taskFlowRepository).save(testTaskFlow);

            // Verify nodes were set
            Set<TaskNode> nodes = testTaskFlow.getNodes();
            assertThat(nodes).hasSize(2);

            // Verify edges were set
            Set<TaskEdge> edges = testTaskFlow.getEdges();
            assertThat(edges).hasSize(1);
        }

        @Test
        @DisplayName("should save task flow with empty nodes and edges")
        void saveTaskFlow_EmptyData_ReturnsId() {
            // Given
            SaveTaskFlowRequest request = new SaveTaskFlowRequest(List.of(), List.of());

            given(taskFlowRepository.findById(1L)).willReturn(Optional.of(testTaskFlow));
            given(taskFlowRepository.save(any(TaskFlow.class))).willReturn(testTaskFlow);

            // When
            Long result = commandService.saveTaskFlow(1L, request);

            // Then
            assertThat(result).isEqualTo(1L);
            assertThat(testTaskFlow.getNodes()).isEmpty();
            assertThat(testTaskFlow.getEdges()).isEmpty();
        }

        @Test
        @DisplayName("should save task flow with null collections")
        void saveTaskFlow_NullCollections_ReturnsId() {
            // Given
            SaveTaskFlowRequest request = new SaveTaskFlowRequest(null, null);

            given(taskFlowRepository.findById(1L)).willReturn(Optional.of(testTaskFlow));
            given(taskFlowRepository.save(any(TaskFlow.class))).willReturn(testTaskFlow);

            // When
            Long result = commandService.saveTaskFlow(1L, request);

            // Then
            assertThat(result).isEqualTo(1L);
            assertThat(testTaskFlow.getNodes()).isEmpty();
            assertThat(testTaskFlow.getEdges()).isEmpty();
        }

        @Test
        @DisplayName("should throw exception when task flow not found")
        void saveTaskFlow_FlowNotFound_ThrowsException() {
            // Given
            SaveTaskFlowRequest request = new SaveTaskFlowRequest(List.of(), List.of());
            given(taskFlowRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> commandService.saveTaskFlow(999L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("TaskFlow");
        }

        @Test
        @DisplayName("should replace existing nodes and edges on save")
        void saveTaskFlow_ReplaceExisting_ClearsOldData() {
            // Given - flow has existing nodes/edges
            TaskNode existingNode = new TaskNode("old-node", "Old Task", null, null, 100, 0.0, 0.0);
            TaskEdge existingEdge = new TaskEdge("old-edge", "old-node", "old-node");
            testTaskFlow.addNode(existingNode);
            testTaskFlow.addEdge(existingEdge);

            SaveTaskFlowRequest request = new SaveTaskFlowRequest(
                    List.of(new SaveTaskFlowRequest.NodeData("new-node", "New Task", null, null, 0, 100.0, 100.0)),
                    List.of()
            );

            given(taskFlowRepository.findById(1L)).willReturn(Optional.of(testTaskFlow));
            given(taskFlowRepository.save(any(TaskFlow.class))).willReturn(testTaskFlow);

            // When
            commandService.saveTaskFlow(1L, request);

            // Then - old data should be replaced
            assertThat(testTaskFlow.getNodes()).hasSize(1);
            assertThat(testTaskFlow.getNodes().iterator().next().getNodeId()).isEqualTo("new-node");
            assertThat(testTaskFlow.getEdges()).isEmpty();
        }

        // TODO: Test edge cases for comprehensive coverage:
        // - Orphaned edges (references non-existent nodes) - should be handled at API validation
        // - Duplicate node IDs in same request
        // - Very large number of nodes/edges (performance)
        // - Concurrent save operations
    }
}
