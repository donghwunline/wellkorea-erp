package com.wellkorea.backend.production.application;

import com.wellkorea.backend.production.api.dto.query.TaskEdgeView;
import com.wellkorea.backend.production.api.dto.query.TaskFlowView;
import com.wellkorea.backend.production.api.dto.query.TaskNodeView;
import com.wellkorea.backend.production.infrastructure.mapper.TaskFlowMapper;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for TaskFlowQueryService.
 * Tests read operations for task flow queries with mocked MyBatis mapper.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TaskFlowQueryService Unit Tests")
@Tag("unit")
class TaskFlowQueryServiceTest {

    @Mock
    private TaskFlowMapper taskFlowMapper;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private TaskFlowQueryService queryService;

    private TaskFlowView testFlowView;
    private TaskNodeView testNodeView;
    private TaskEdgeView testEdgeView;

    @BeforeEach
    void setUp() {
        testNodeView = new TaskNodeView(
                "node-1",
                "Design Phase",
                "Alice",
                LocalDate.now().plusDays(7),
                50,
                100.0,
                100.0
        );

        testEdgeView = new TaskEdgeView(
                "edge-1",
                "node-1",
                "node-2"
        );

        testFlowView = new TaskFlowView(
                1L,
                1L,
                List.of(testNodeView),
                List.of(testEdgeView),
                Instant.now(),
                Instant.now()
        );
    }

    @Nested
    @DisplayName("getByProjectId - Get task flow by project ID")
    class GetByProjectIdTests {

        @Test
        @DisplayName("should return task flow view when flow exists")
        void getByProjectId_FlowExists_ReturnsView() {
            // Given
            given(projectRepository.existsById(1L)).willReturn(true);
            given(taskFlowMapper.findByProjectId(1L)).willReturn(Optional.of(testFlowView));

            // When
            TaskFlowView result = queryService.getByProjectId(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.projectId()).isEqualTo(1L);
            assertThat(result.nodes()).hasSize(1);
            assertThat(result.edges()).hasSize(1);
            verify(taskFlowMapper).findByProjectId(1L);
        }

        @Test
        @DisplayName("should return empty flow view when no flow exists for project")
        void getByProjectId_FlowNotExists_ReturnsEmptyView() {
            // Given
            given(projectRepository.existsById(1L)).willReturn(true);
            given(taskFlowMapper.findByProjectId(1L)).willReturn(Optional.empty());

            // When
            TaskFlowView result = queryService.getByProjectId(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isNull();
            assertThat(result.projectId()).isEqualTo(1L);
            assertThat(result.nodes()).isEmpty();
            assertThat(result.edges()).isEmpty();
        }

        @Test
        @DisplayName("should throw exception when project not found")
        void getByProjectId_ProjectNotFound_ThrowsException() {
            // Given
            given(projectRepository.existsById(999L)).willReturn(false);

            // When/Then
            assertThatThrownBy(() -> queryService.getByProjectId(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Project")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("getById - Get task flow by ID")
    class GetByIdTests {

        @Test
        @DisplayName("should return task flow view when flow exists")
        void getById_FlowExists_ReturnsView() {
            // Given
            given(taskFlowMapper.findById(1L)).willReturn(Optional.of(testFlowView));

            // When
            TaskFlowView result = queryService.getById(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.nodes()).hasSize(1);
            assertThat(result.nodes().get(0).title()).isEqualTo("Design Phase");
            assertThat(result.nodes().get(0).progress()).isEqualTo(50);
            verify(taskFlowMapper).findById(1L);
        }

        @Test
        @DisplayName("should throw exception when task flow not found")
        void getById_FlowNotFound_ThrowsException() {
            // Given
            given(taskFlowMapper.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getById(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("TaskFlow")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("Node and Edge data integrity")
    class DataIntegrityTests {

        @Test
        @DisplayName("should return flow with multiple nodes and edges")
        void getById_MultipleNodesAndEdges_ReturnsAll() {
            // Given
            TaskNodeView node1 = new TaskNodeView("n1", "Task 1", "Alice", null, 0, 0.0, 0.0);
            TaskNodeView node2 = new TaskNodeView("n2", "Task 2", "Bob", null, 50, 200.0, 0.0);
            TaskNodeView node3 = new TaskNodeView("n3", "Task 3", null, null, 100, 400.0, 0.0);

            TaskEdgeView edge1 = new TaskEdgeView("e1", "n1", "n2");
            TaskEdgeView edge2 = new TaskEdgeView("e2", "n2", "n3");

            TaskFlowView flowWithMultiple = new TaskFlowView(
                    1L, 1L,
                    List.of(node1, node2, node3),
                    List.of(edge1, edge2),
                    Instant.now(), Instant.now()
            );

            given(taskFlowMapper.findById(1L)).willReturn(Optional.of(flowWithMultiple));

            // When
            TaskFlowView result = queryService.getById(1L);

            // Then
            assertThat(result.nodes()).hasSize(3);
            assertThat(result.edges()).hasSize(2);
        }

        @Test
        @DisplayName("should return flow with empty collections")
        void getById_EmptyCollections_ReturnsEmptyLists() {
            // Given
            TaskFlowView emptyFlow = new TaskFlowView(
                    1L, 1L,
                    List.of(),
                    List.of(),
                    Instant.now(), Instant.now()
            );

            given(taskFlowMapper.findById(1L)).willReturn(Optional.of(emptyFlow));

            // When
            TaskFlowView result = queryService.getById(1L);

            // Then
            assertThat(result.nodes()).isEmpty();
            assertThat(result.edges()).isEmpty();
        }

        // TODO: Test edge cases for comprehensive coverage:
        // - Node with null optional fields (assignee, deadline)
        // - Very large number of nodes/edges
        // - Edge referencing non-existent node (data integrity issue)
    }
}
