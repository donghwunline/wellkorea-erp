package com.wellkorea.backend.production.api;

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
 * Contract tests for blueprint attachment endpoints.
 * Tests validate the blueprint attachment API contract for US7 (Outsourcing Blueprints).
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("BlueprintAttachment Controller Contract Tests")
class BlueprintAttachmentControllerTest extends BaseIntegrationTest implements TestFixtures {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String productionToken;
    private String salesToken;

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);
        DatabaseTestHelper.insertTestCustomer(jdbcTemplate);

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), 1L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);
    }

    /**
     * Helper to insert a test project.
     */
    private Long insertTestProject() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
        String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
        Long projectId = 3000L;
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                projectId, "WK2K" + year + "-3000-" + today, 1L, "Test Project for Blueprints",
                LocalDate.now().plusDays(30), 1L, "DRAFT", 1L
        );
        return projectId;
    }

    /**
     * Helper to insert a test task flow with a node.
     */
    private Long insertTestTaskFlow(Long projectId) {
        Long flowId = 3000L;
        jdbcTemplate.update(
                "INSERT INTO task_flows (id, project_id, created_at, updated_at) " +
                        "VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                flowId, projectId
        );

        // Add a test node
        jdbcTemplate.update(
                "INSERT INTO task_nodes (flow_id, node_id, title, assignee, deadline, progress, position_x, position_y) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                flowId, "outsource-node-1", "Outsource Laser Cutting", "Vendor A",
                LocalDate.now().plusDays(7), 0, 100.0, 100.0
        );

        return flowId;
    }

    /**
     * Helper to insert a test blueprint attachment.
     */
    private Long insertTestAttachment(Long flowId, String nodeId) {
        Long attachmentId = 3000L;
        jdbcTemplate.update(
                "INSERT INTO blueprint_attachments (id, task_flow_id, node_id, file_name, file_type, file_size, storage_path, uploaded_by_id, uploaded_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                attachmentId, flowId, nodeId, "drawing.pdf", "PDF", 1024L,
                "blueprints/flow-" + flowId + "/node-" + nodeId + "/drawing.pdf", 1L
        );
        return attachmentId;
    }

    @Nested
    @DisplayName("POST /api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url - Get Upload URL")
    class GetUploadUrlTests {

        @Test
        @DisplayName("should return 200 with presigned upload URL for valid PDF")
        void getUploadUrl_ValidPdf_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String requestJson = """
                    {
                        "fileName": "blueprint.pdf",
                        "fileSize": 1024,
                        "contentType": "application/pdf"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url",
                            flowId, "outsource-node-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.uploadUrl").isString())
                    .andExpect(jsonPath("$.data.uploadUrl", containsString("http")))
                    .andExpect(jsonPath("$.data.objectKey").isString())
                    .andExpect(jsonPath("$.data.objectKey", containsString("blueprints/")));
        }

        @Test
        @DisplayName("should return 200 with presigned upload URL for valid DXF")
        void getUploadUrl_ValidDxf_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String requestJson = """
                    {
                        "fileName": "drawing.dxf",
                        "fileSize": 2048,
                        "contentType": "application/dxf"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url",
                            flowId, "outsource-node-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.uploadUrl").isString());
        }

        @Test
        @DisplayName("should return 400 when file type is not allowed")
        void getUploadUrl_InvalidFileType_Returns400() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String requestJson = """
                    {
                        "fileName": "script.exe",
                        "fileSize": 1024,
                        "contentType": "application/octet-stream"
                    }
                    """;

            // When & Then - BusinessException returns ErrorResponse format
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url",
                            flowId, "outsource-node-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BUS_001"))
                    .andExpect(jsonPath("$.message", containsString("File type not allowed")));
        }

        @Test
        @DisplayName("should return 400 when node does not exist")
        void getUploadUrl_NodeNotFound_Returns400() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String requestJson = """
                    {
                        "fileName": "blueprint.pdf",
                        "fileSize": 1024,
                        "contentType": "application/pdf"
                    }
                    """;

            // When & Then - BusinessException returns ErrorResponse format
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url",
                            flowId, "non-existent-node")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BUS_001"))
                    .andExpect(jsonPath("$.message", containsString("not found")));
        }

        @Test
        @DisplayName("should return 404 when TaskFlow does not exist")
        void getUploadUrl_TaskFlowNotFound_Returns404() throws Exception {
            // Given
            String requestJson = """
                    {
                        "fileName": "blueprint.pdf",
                        "fileSize": 1024,
                        "contentType": "application/pdf"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url",
                            99999L, "some-node")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 403 when Sales role tries to get upload URL")
        void getUploadUrl_SalesRole_Returns403() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String requestJson = """
                    {
                        "fileName": "blueprint.pdf",
                        "fileSize": 1024,
                        "contentType": "application/pdf"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url",
                            flowId, "outsource-node-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void getUploadUrl_Unauthenticated_Returns401() throws Exception {
            // Given
            String requestJson = """
                    {
                        "fileName": "blueprint.pdf",
                        "fileSize": 1024,
                        "contentType": "application/pdf"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url",
                            1L, "some-node")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 400 when duplicate file name exists")
        void getUploadUrl_DuplicateFileName_Returns400() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            insertTestAttachment(flowId, "outsource-node-1"); // Inserts "drawing.pdf"

            String requestJson = """
                    {
                        "fileName": "drawing.pdf",
                        "fileSize": 1024,
                        "contentType": "application/pdf"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url",
                            flowId, "outsource-node-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BUS_001"))
                    .andExpect(jsonPath("$.message", containsString("already exists")));
        }
    }

    @Nested
    @DisplayName("POST /api/task-flows/{flowId}/nodes/{nodeId}/attachments/register - Register Attachment")
    class RegisterAttachmentTests {

        @Test
        @DisplayName("should return 400 when file not found in storage")
        void registerAttachment_FileNotInStorage_Returns400() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String requestJson = """
                    {
                        "fileName": "blueprint.pdf",
                        "fileSize": 1024,
                        "objectKey": "blueprints/flow-3000/node-outsource-node-1/non-existent.pdf"
                    }
                    """;

            // When & Then - File doesn't exist in MinIO
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/register",
                            flowId, "outsource-node-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BUS_001"))
                    .andExpect(jsonPath("$.message", containsString("not found in storage")));
        }

        @Test
        @DisplayName("should return 400 when node does not exist")
        void registerAttachment_NodeNotFound_Returns400() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String requestJson = """
                    {
                        "fileName": "blueprint.pdf",
                        "fileSize": 1024,
                        "objectKey": "blueprints/flow-3000/node-non-existent/blueprint.pdf"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/register",
                            flowId, "non-existent-node")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("BUS_001"))
                    .andExpect(jsonPath("$.message", containsString("not found")));
        }

        @Test
        @DisplayName("should return 403 when Sales role tries to register")
        void registerAttachment_SalesRole_Returns403() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            String requestJson = """
                    {
                        "fileName": "blueprint.pdf",
                        "fileSize": 1024,
                        "objectKey": "blueprints/flow-3000/node-outsource-node-1/blueprint.pdf"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/register",
                            flowId, "outsource-node-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void registerAttachment_Unauthenticated_Returns401() throws Exception {
            // Given
            String requestJson = """
                    {
                        "fileName": "blueprint.pdf",
                        "fileSize": 1024,
                        "objectKey": "blueprints/flow-1/node-some-node/blueprint.pdf"
                    }
                    """;

            // When & Then
            mockMvc.perform(post("/api/task-flows/{flowId}/nodes/{nodeId}/attachments/register",
                            1L, "some-node")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/task-flows/{flowId}/attachments - List Attachments by Flow")
    class ListAttachmentsByFlowTests {

        @Test
        @DisplayName("should return 200 with list of attachments")
        void listByFlow_AttachmentsExist_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            insertTestAttachment(flowId, "outsource-node-1");

            // When & Then
            mockMvc.perform(get("/api/task-flows/{flowId}/attachments", flowId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].fileName").value("drawing.pdf"))
                    .andExpect(jsonPath("$.data[0].fileType").value("PDF"));
        }

        @Test
        @DisplayName("should return 200 with empty list when no attachments")
        void listByFlow_NoAttachments_Returns200WithEmptyList() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);

            // When & Then
            mockMvc.perform(get("/api/task-flows/{flowId}/attachments", flowId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }

        @Test
        @DisplayName("should allow Sales role to view attachments")
        void listByFlow_SalesRole_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            insertTestAttachment(flowId, "outsource-node-1");

            // When & Then
            mockMvc.perform(get("/api/task-flows/{flowId}/attachments", flowId)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Nested
    @DisplayName("GET /api/task-flows/{flowId}/nodes/{nodeId}/attachments - List Attachments by Node")
    class ListAttachmentsByNodeTests {

        @Test
        @DisplayName("should return 200 with attachments for specific node")
        void listByNode_AttachmentsExist_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            insertTestAttachment(flowId, "outsource-node-1");

            // When & Then
            mockMvc.perform(get("/api/task-flows/{flowId}/nodes/{nodeId}/attachments",
                            flowId, "outsource-node-1")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data", hasSize(1)));
        }
    }

    @Nested
    @DisplayName("GET /api/blueprints/{id} - Get Attachment Metadata")
    class GetAttachmentTests {

        @Test
        @DisplayName("should return 200 with attachment details")
        void getAttachment_Exists_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            Long attachmentId = insertTestAttachment(flowId, "outsource-node-1");

            // When & Then
            mockMvc.perform(get("/api/blueprints/{id}", attachmentId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(attachmentId))
                    .andExpect(jsonPath("$.data.fileName").value("drawing.pdf"))
                    .andExpect(jsonPath("$.data.fileType").value("PDF"))
                    .andExpect(jsonPath("$.data.fileSize").value(1024))
                    .andExpect(jsonPath("$.data.formattedFileSize").value("1.0 KB"));
        }

        @Test
        @DisplayName("should return 404 when attachment not found")
        void getAttachment_NotFound_Returns404() throws Exception {
            // When & Then
            mockMvc.perform(get("/api/blueprints/{id}", 99999L)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/blueprints/{id} - Delete Attachment")
    class DeleteAttachmentTests {

        @Test
        @DisplayName("should return 200 when deleting existing attachment")
        void deleteAttachment_Exists_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            Long attachmentId = insertTestAttachment(flowId, "outsource-node-1");

            // When & Then
            mockMvc.perform(delete("/api/blueprints/{id}", attachmentId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(attachmentId))
                    .andExpect(jsonPath("$.data.message").value("Blueprint attachment deleted successfully"));
        }

        @Test
        @DisplayName("should return 404 when attachment not found")
        void deleteAttachment_NotFound_Returns404() throws Exception {
            // When & Then
            mockMvc.perform(delete("/api/blueprints/{id}", 99999L)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should allow Production role to delete")
        void deleteAttachment_ProductionRole_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            Long attachmentId = insertTestAttachment(flowId, "outsource-node-1");

            // When & Then
            mockMvc.perform(delete("/api/blueprints/{id}", attachmentId)
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return 403 when Sales role tries to delete")
        void deleteAttachment_SalesRole_Returns403() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            Long attachmentId = insertTestAttachment(flowId, "outsource-node-1");

            // When & Then
            mockMvc.perform(delete("/api/blueprints/{id}", attachmentId)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/blueprints/{id}/url - Get Presigned Download URL")
    class GetDownloadUrlTests {

        @Test
        @DisplayName("should return 200 with presigned URL")
        void getDownloadUrl_Exists_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            Long attachmentId = insertTestAttachment(flowId, "outsource-node-1");

            // When & Then
            mockMvc.perform(get("/api/blueprints/{id}/url", attachmentId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isString())
                    .andExpect(jsonPath("$.data", containsString("http")));
        }

        @Test
        @DisplayName("should respect custom expiry parameter")
        void getDownloadUrl_CustomExpiry_Returns200() throws Exception {
            // Given
            Long projectId = insertTestProject();
            Long flowId = insertTestTaskFlow(projectId);
            Long attachmentId = insertTestAttachment(flowId, "outsource-node-1");

            // When & Then
            mockMvc.perform(get("/api/blueprints/{id}/url", attachmentId)
                            .param("expiryMinutes", "30")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}
