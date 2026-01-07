package com.wellkorea.backend.production.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.shared.test.DatabaseTestHelper;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/task-flows endpoints.
 * Tests validate the task flow management API contract.
 * <p>
 * Following CQRS pattern:
 * - Command endpoints (PUT) return TaskFlowCommandResult with { id, message }
 * - Query endpoints (GET) return TaskFlowView
 * <p>
 * TaskFlow is used for DAG-based task visualization in React Flow.
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("TaskFlow Controller Contract Tests")
class TaskFlowControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String TASK_FLOWS_URL = "/api/task-flows";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String productionToken;

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);
        DatabaseTestHelper.insertTestCustomer(jdbcTemplate);

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), 1L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);
    }

    /**
     * Helper to insert a test project.
     * Returns the project ID.
     */
    private Long insertTestProject() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
        String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
        Long projectId = 2000L;
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                projectId, "WK2K" + year + "-2000-" + today, 1L, "Test Project for TaskFlow",
                LocalDate.now().plusDays(30), 1L, "DRAFT", 1L
        );
        return projectId;
    }

    /**
     * Helper to insert a test task flow.
     * Returns the task flow ID.
     */
    private Long insertTestTaskFlow(Long projectId) {
        Long flowId = 1000L;
        jdbcTemplate.update(
                "INSERT INTO task_flows (id, project_id, created_at, updated_at) " +
                        "VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                flowId, projectId
        );
        return flowId;
    }

    /**
     * Helper to insert test nodes for a task flow.
     */
    private void insertTestNodes(Long flowId) {
        jdbcTemplate.update(
                "INSERT INTO task_nodes (flow_id, node_id, title, assignee, deadline, progress, position_x, position_y) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?), " +
                        "       (?, ?, ?, ?, ?, ?, ?, ?)",
                flowId, "node-1", "Design", "Alice", LocalDate.now().plusDays(7), 50, 100.0, 100.0,
                flowId, "node-2", "Implementation", "Bob", LocalDate.now().plusDays(14), 0, 300.0, 100.0
        );
    }

    /**
     * Helper to insert test edges for a task flow.
     */
    private void insertTestEdges(Long flowId) {
        jdbcTemplate.update(
                "INSERT INTO task_edges (flow_id, edge_id, source_node_id, target_node_id) " +
                        "VALUES (?, ?, ?, ?)",
                flowId, "edge-1", "node-1", "node-2"
        );
    }

    @Nested
    @DisplayName("GET /api/task-flows?projectId={id} - Get TaskFlow by Project")
    class GetTaskFlowByProjectTests {

        @Test
        @DisplayName("should return 200 with new empty flow when no flow exists")
        void getTaskFlow_NoFlowExists_Returns200WithNewFlow() throws Exception {
            // Given - A project exists but no task flow
            Long projectId = insertTestProject();

            // When & Then
            mockMvc.perform(get(TASK_FLOWS_URL)
                            .param("projectId", projectId.toString())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.projectId").value(projectId))
                    .andExpect(jsonPath("$.data.nodes").isArray())
                    .andExpect(jsonPath("$.data.edges").isArray());
        }

        @Test
        @DisplayName("should return 200 with existing flow and data")
        void getTaskFlow_FlowExists_Returns200WithData() throws Exception {
            // Given - A project and task flow with nodes/edges exist
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            insertTestNodes(flowId);
            insertTestEdges(flowId);

            // When & Then
            mockMvc.perform(get(TASK_FLOWS_URL)
                            .param("projectId", projectId.toString())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(flowId))
                    .andExpect(jsonPath("$.data.projectId").value(projectId))
                    .andExpect(jsonPath("$.data.nodes").isArray())
                    .andExpect(jsonPath("$.data.nodes", hasSize(2)))
                    .andExpect(jsonPath("$.data.edges").isArray())
                    .andExpect(jsonPath("$.data.edges", hasSize(1)));
        }

        @Test
        @DisplayName("should return 404 when project not found")
        void getTaskFlow_ProjectNotFound_Returns404() throws Exception {
            // Given - No project with this ID exists
            Long nonExistentProjectId = 99999L;

            // When & Then
            mockMvc.perform(get(TASK_FLOWS_URL)
                            .param("projectId", nonExistentProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("RES_001"));
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void getTaskFlow_Unauthenticated_Returns401() throws Exception {
            // When & Then
            mockMvc.perform(get(TASK_FLOWS_URL)
                            .param("projectId", "1"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/task-flows/{id} - Get TaskFlow by ID")
    class GetTaskFlowByIdTests {

        @Test
        @DisplayName("should return 200 with task flow view")
        void getTaskFlowById_FlowExists_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            insertTestNodes(flowId);
            insertTestEdges(flowId);

            // When & Then
            mockMvc.perform(get(TASK_FLOWS_URL + "/" + flowId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(flowId))
                    .andExpect(jsonPath("$.data.nodes", hasSize(2)))
                    .andExpect(jsonPath("$.data.edges", hasSize(1)));
        }

        @Test
        @DisplayName("should return 404 when task flow not found")
        void getTaskFlowById_FlowNotFound_Returns404() throws Exception {
            // Given - No flow with this ID exists
            Long nonExistentFlowId = 99999L;

            // When & Then
            mockMvc.perform(get(TASK_FLOWS_URL + "/" + nonExistentFlowId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("RES_001"));
        }
    }

    @Nested
    @DisplayName("PUT /api/task-flows/{id} - Save TaskFlow")
    class SaveTaskFlowTests {

        @Test
        @DisplayName("should return 200 with command result when saving valid data")
        void saveTaskFlow_ValidData_Returns200WithCommandResult() throws Exception {
            // Given - Create project and task flow
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String saveRequest = """
                    {
                        "nodes": [
                            {
                                "id": "node-1",
                                "title": "Design Phase",
                                "assignee": "Alice",
                                "deadline": "%s",
                                "progress": 75,
                                "positionX": 100.0,
                                "positionY": 100.0
                            },
                            {
                                "id": "node-2",
                                "title": "Implementation",
                                "assignee": "Bob",
                                "deadline": "%s",
                                "progress": 25,
                                "positionX": 300.0,
                                "positionY": 100.0
                            }
                        ],
                        "edges": [
                            {
                                "id": "edge-1",
                                "source": "node-1",
                                "target": "node-2"
                            }
                        ]
                    }
                    """.formatted(
                    LocalDate.now().plusDays(7),
                    LocalDate.now().plusDays(14)
            );

            // When & Then - CQRS: Command returns { id, message }
            mockMvc.perform(put(TASK_FLOWS_URL + "/" + flowId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(saveRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(flowId))
                    .andExpect(jsonPath("$.data.message").exists());
        }

        @Test
        @DisplayName("should return 200 when saving empty flow (clear all nodes/edges)")
        void saveTaskFlow_EmptyData_Returns200() throws Exception {
            // Given - Create project and task flow with existing data
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            insertTestNodes(flowId);
            insertTestEdges(flowId);

            String emptyRequest = """
                    {
                        "nodes": [],
                        "edges": []
                    }
                    """;

            // When & Then
            mockMvc.perform(put(TASK_FLOWS_URL + "/" + flowId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(emptyRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(flowId));
        }

        @Test
        @DisplayName("should return 404 when task flow not found")
        void saveTaskFlow_FlowNotFound_Returns404() throws Exception {
            // Given - No flow with this ID exists
            Long nonExistentFlowId = 99999L;
            String saveRequest = """
                    {
                        "nodes": [],
                        "edges": []
                    }
                    """;

            // When & Then
            mockMvc.perform(put(TASK_FLOWS_URL + "/" + nonExistentFlowId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(saveRequest))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errorCode").value("RES_001"));
        }

        @Test
        @DisplayName("should allow Production role to save task flow")
        void saveTaskFlow_AsProduction_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String saveRequest = """
                    {
                        "nodes": [
                            {
                                "id": "node-1",
                                "title": "Production Task",
                                "progress": 50,
                                "positionX": 100.0,
                                "positionY": 100.0
                            }
                        ],
                        "edges": []
                    }
                    """;

            // When & Then - Production role should have access
            mockMvc.perform(put(TASK_FLOWS_URL + "/" + flowId)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(saveRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void saveTaskFlow_Unauthenticated_Returns401() throws Exception {
            // Given
            String saveRequest = """
                    {
                        "nodes": [],
                        "edges": []
                    }
                    """;

            // When & Then
            mockMvc.perform(put(TASK_FLOWS_URL + "/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(saveRequest))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 400 for invalid JSON format")
        void saveTaskFlow_InvalidJson_Returns400() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String invalidJson = "{ invalid json }";

            // When & Then
            mockMvc.perform(put(TASK_FLOWS_URL + "/" + flowId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when node missing required title")
        void saveTaskFlow_MissingNodeTitle_Returns400() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String saveRequest = """
                    {
                        "nodes": [
                            {
                                "id": "node-1",
                                "assignee": "Alice",
                                "progress": 50,
                                "positionX": 100.0,
                                "positionY": 100.0
                            }
                        ],
                        "edges": []
                    }
                    """;

            // When & Then
            mockMvc.perform(put(TASK_FLOWS_URL + "/" + flowId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(saveRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when node missing required ID")
        void saveTaskFlow_MissingNodeId_Returns400() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String saveRequest = """
                    {
                        "nodes": [
                            {
                                "title": "Task",
                                "progress": 50,
                                "positionX": 100.0,
                                "positionY": 100.0
                            }
                        ],
                        "edges": []
                    }
                    """;

            // When & Then
            mockMvc.perform(put(TASK_FLOWS_URL + "/" + flowId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(saveRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when edge missing required source")
        void saveTaskFlow_MissingEdgeSource_Returns400() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String saveRequest = """
                    {
                        "nodes": [
                            {"id": "node-1", "title": "Task 1", "progress": 0, "positionX": 0, "positionY": 0}
                        ],
                        "edges": [
                            {"id": "edge-1", "target": "node-1"}
                        ]
                    }
                    """;

            // When & Then
            mockMvc.perform(put(TASK_FLOWS_URL + "/" + flowId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(saveRequest))
                    .andExpect(status().isBadRequest());
        }

        // Note: Duplicate ID validation and cycle detection are handled in frontend.
        // Backend uses @ElementCollection which replaces all items on save,
        // so duplicate IDs would result in data loss but not an error.
        // Concurrent save operations use optimistic locking via JPA versioning.
    }

    @Nested
    @DisplayName("Save response validation")
    class SaveResponseValidationTests {

        @Test
        @DisplayName("should return success response with flow ID after save")
        void saveTaskFlow_ValidData_ReturnsSuccessWithId() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String saveRequest = """
                    {
                        "nodes": [
                            {
                                "id": "saved-node-1",
                                "title": "Saved Task",
                                "assignee": "Tester",
                                "progress": 42,
                                "positionX": 150.0,
                                "positionY": 200.0
                            }
                        ],
                        "edges": []
                    }
                    """;

            // When & Then - Trust the API response directly
            mockMvc.perform(put(TASK_FLOWS_URL + "/" + flowId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(saveRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(flowId))
                    .andExpect(jsonPath("$.data.message").exists());
        }
    }
}
