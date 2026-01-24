package com.wellkorea.backend.production.application;

import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.shared.stoarage.infrastructure.MinioFileStorage;
import com.wellkorea.backend.production.api.dto.command.UploadUrlResponse;
import com.wellkorea.backend.production.api.dto.query.BlueprintAttachmentView;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.test.DatabaseTestHelper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for BlueprintAttachmentService.
 * Uses real PostgreSQL and MinIO via Testcontainers.
 */
@Tag("integration")
@Transactional
@DisplayName("BlueprintAttachmentService Tests")
class BlueprintAttachmentServiceTest extends BaseIntegrationTest {

    @Autowired
    private BlueprintAttachmentService attachmentService;

    @Autowired
    private MinioFileStorage minioFileStorage;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Long projectId;
    private Long flowId;
    private static final String NODE_ID = "test-node-1";

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);
        DatabaseTestHelper.insertTestCustomer(jdbcTemplate);

        // Create test project
        projectId = insertTestProject();
        // Create test task flow with a node
        flowId = insertTestTaskFlow(projectId);
    }

    private Long insertTestProject() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
        String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
        Long id = 9000L;
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, "WK2K" + year + "-9000-" + today, 1L, "Test Project for Service Tests",
                LocalDate.now().plusDays(30), 1L, "DRAFT", 1L
        );
        return id;
    }

    private Long insertTestTaskFlow(Long projectId) {
        Long id = 9000L;
        jdbcTemplate.update(
                "INSERT INTO task_flows (id, project_id, created_at, updated_at) " +
                        "VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, projectId
        );

        // Add a test node
        jdbcTemplate.update(
                "INSERT INTO task_nodes (flow_id, node_id, title, assignee, deadline, progress, position_x, position_y) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                id, NODE_ID, "Test Task Node", "Test Assignee",
                LocalDate.now().plusDays(7), 0, 100.0, 100.0
        );

        return id;
    }

    // ========================================================================
    // generateUploadUrl Tests
    // ========================================================================

    @Nested
    @DisplayName("generateUploadUrl()")
    class GenerateUploadUrlTests {

        @Test
        @DisplayName("should return presigned URL and object key for valid request")
        void generateUploadUrl_ValidRequest_ReturnsUrlAndKey() {
            // When
            UploadUrlResponse response = attachmentService.generateUploadUrl(
                    flowId, NODE_ID, "blueprint.pdf", 1024L, "application/pdf"
            );

            // Then
            assertThat(response).isNotNull();
            assertThat(response.uploadUrl()).isNotBlank();
            assertThat(response.uploadUrl()).contains("http");
            assertThat(response.objectKey()).isNotBlank();
            assertThat(response.objectKey()).contains("blueprints/");
            assertThat(response.objectKey()).contains("flow-" + flowId);
            assertThat(response.objectKey()).contains("node-" + NODE_ID);
            assertThat(response.objectKey()).contains("blueprint.pdf");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for non-existent TaskFlow")
        void generateUploadUrl_TaskFlowNotFound_ThrowsException() {
            // When/Then
            assertThatThrownBy(() -> attachmentService.generateUploadUrl(
                    99999L, NODE_ID, "blueprint.pdf", 1024L, "application/pdf"
            ))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("TaskFlow");
        }

        @Test
        @DisplayName("should throw BusinessException for non-existent node")
        void generateUploadUrl_NodeNotFound_ThrowsException() {
            // When/Then
            assertThatThrownBy(() -> attachmentService.generateUploadUrl(
                    flowId, "non-existent-node", "blueprint.pdf", 1024L, "application/pdf"
            ))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("should throw BusinessException for disallowed file type")
        void generateUploadUrl_InvalidFileType_ThrowsException() {
            // When/Then
            assertThatThrownBy(() -> attachmentService.generateUploadUrl(
                    flowId, NODE_ID, "script.exe", 1024L, "application/octet-stream"
            ))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("File type not allowed");
        }

        @Test
        @DisplayName("should accept all allowed file types")
        void generateUploadUrl_AllowedFileTypes_Succeeds() {
            String[] allowedFiles = {"drawing.pdf", "model.dxf", "blueprint.dwg", "image.png", "photo.jpg", "picture.jpeg"};

            for (String fileName : allowedFiles) {
                UploadUrlResponse response = attachmentService.generateUploadUrl(
                        flowId, NODE_ID, fileName, 1024L, "application/octet-stream"
                );
                assertThat(response.uploadUrl()).isNotBlank();
            }
        }
    }

    // ========================================================================
    // registerAttachment Tests
    // ========================================================================

    @Nested
    @DisplayName("registerAttachment()")
    class RegisterAttachmentTests {

        @Test
        @DisplayName("should register attachment when file exists in MinIO")
        void registerAttachment_FileExists_RegistersSuccessfully() {
            // Given - Upload a file to MinIO first
            String objectKey = "blueprints/flow-" + flowId + "/node-" + NODE_ID + "/test-file.pdf";
            minioFileStorage.uploadFile(objectKey, "PDF content".getBytes(), "application/pdf");

            // When
            Long attachmentId = attachmentService.registerAttachment(
                    flowId, NODE_ID, "test-file.pdf", 11L, objectKey, 1L
            );

            // Then
            assertThat(attachmentId).isNotNull();
            assertThat(attachmentId).isGreaterThan(0);

            // Verify attachment was saved
            BlueprintAttachmentView view = attachmentService.getAttachment(attachmentId);
            assertThat(view.fileName()).isEqualTo("test-file.pdf");
            assertThat(view.fileSize()).isEqualTo(11L);
            assertThat(view.storagePath()).isEqualTo(objectKey);
        }

        @Test
        @DisplayName("should throw BusinessException when file not found in MinIO")
        void registerAttachment_FileNotInStorage_ThrowsException() {
            // When/Then
            assertThatThrownBy(() -> attachmentService.registerAttachment(
                    flowId, NODE_ID, "missing.pdf", 1024L,
                    "blueprints/flow-" + flowId + "/node-" + NODE_ID + "/missing.pdf", 1L
            ))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not found in storage");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for non-existent TaskFlow")
        void registerAttachment_TaskFlowNotFound_ThrowsException() {
            // When/Then
            assertThatThrownBy(() -> attachmentService.registerAttachment(
                    99999L, NODE_ID, "test.pdf", 1024L, "some/path", 1L
            ))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("TaskFlow");
        }

        @Test
        @DisplayName("should throw BusinessException for non-existent node")
        void registerAttachment_NodeNotFound_ThrowsException() {
            // When/Then
            assertThatThrownBy(() -> attachmentService.registerAttachment(
                    flowId, "non-existent-node", "test.pdf", 1024L, "some/path", 1L
            ))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for non-existent user")
        void registerAttachment_UserNotFound_ThrowsException() {
            // Given - Upload a file to MinIO first
            String objectKey = "blueprints/flow-" + flowId + "/node-" + NODE_ID + "/user-test.pdf";
            minioFileStorage.uploadFile(objectKey, "PDF content".getBytes(), "application/pdf");

            // When/Then
            assertThatThrownBy(() -> attachmentService.registerAttachment(
                    flowId, NODE_ID, "user-test.pdf", 11L, objectKey, 99999L
            ))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }

    // ========================================================================
    // Query Tests (getAttachmentsByNode, getAttachmentsByFlow, getAttachment)
    // ========================================================================

    @Nested
    @DisplayName("Query Operations")
    class QueryTests {

        private Long attachmentId;

        @BeforeEach
        void setUpAttachment() {
            // Upload and register a test attachment
            String objectKey = "blueprints/flow-" + flowId + "/node-" + NODE_ID + "/query-test.pdf";
            minioFileStorage.uploadFile(objectKey, "Test content".getBytes(), "application/pdf");
            attachmentId = attachmentService.registerAttachment(
                    flowId, NODE_ID, "query-test.pdf", 12L, objectKey, 1L
            );
        }

        @Test
        @DisplayName("getAttachmentsByNode should return attachments for specific node")
        void getAttachmentsByNode_ReturnsAttachments() {
            // When
            List<BlueprintAttachmentView> attachments = attachmentService.getAttachmentsByNode(flowId, NODE_ID);

            // Then
            assertThat(attachments).hasSize(1);
            assertThat(attachments.get(0).fileName()).isEqualTo("query-test.pdf");
        }

        @Test
        @DisplayName("getAttachmentsByNode should return empty list for node with no attachments")
        void getAttachmentsByNode_NoAttachments_ReturnsEmptyList() {
            // Add another node without attachments
            jdbcTemplate.update(
                    "INSERT INTO task_nodes (flow_id, node_id, title, progress, position_x, position_y) " +
                            "VALUES (?, ?, ?, ?, ?, ?)",
                    flowId, "empty-node", "Empty Node", 0, 200.0, 200.0
            );

            // When
            List<BlueprintAttachmentView> attachments = attachmentService.getAttachmentsByNode(flowId, "empty-node");

            // Then
            assertThat(attachments).isEmpty();
        }

        @Test
        @DisplayName("getAttachmentsByFlow should return all attachments in flow")
        void getAttachmentsByFlow_ReturnsAllAttachments() {
            // When
            List<BlueprintAttachmentView> attachments = attachmentService.getAttachmentsByFlow(flowId);

            // Then
            assertThat(attachments).hasSize(1);
        }

        @Test
        @DisplayName("getAttachment should return attachment details by ID")
        void getAttachment_Exists_ReturnsDetails() {
            // When
            BlueprintAttachmentView view = attachmentService.getAttachment(attachmentId);

            // Then
            assertThat(view.id()).isEqualTo(attachmentId);
            assertThat(view.taskFlowId()).isEqualTo(flowId);
            assertThat(view.nodeId()).isEqualTo(NODE_ID);
            assertThat(view.fileName()).isEqualTo("query-test.pdf");
            assertThat(view.formattedFileSize()).isNotBlank();
            assertThat(view.uploadedByName()).isNotBlank();
            assertThat(view.uploadedAt()).isNotNull();
        }

        @Test
        @DisplayName("getAttachment should throw ResourceNotFoundException for non-existent ID")
        void getAttachment_NotFound_ThrowsException() {
            // When/Then
            assertThatThrownBy(() -> attachmentService.getAttachment(99999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("BlueprintAttachment");
        }
    }

    // ========================================================================
    // deleteAttachment Tests
    // ========================================================================

    @Nested
    @DisplayName("deleteAttachment()")
    class DeleteAttachmentTests {

        @Test
        @DisplayName("should delete attachment from database and MinIO")
        void deleteAttachment_Exists_DeletesSuccessfully() {
            // Given - Upload and register an attachment
            String objectKey = "blueprints/flow-" + flowId + "/node-" + NODE_ID + "/delete-test.pdf";
            minioFileStorage.uploadFile(objectKey, "Delete me".getBytes(), "application/pdf");
            Long attachmentId = attachmentService.registerAttachment(
                    flowId, NODE_ID, "delete-test.pdf", 9L, objectKey, 1L
            );

            // Verify it exists
            assertThat(minioFileStorage.fileExists(objectKey)).isTrue();

            // When
            attachmentService.deleteAttachment(attachmentId);

            // Then - Attachment should be removed from database
            assertThatThrownBy(() -> attachmentService.getAttachment(attachmentId))
                    .isInstanceOf(ResourceNotFoundException.class);

            // And file should be removed from MinIO
            assertThat(minioFileStorage.fileExists(objectKey)).isFalse();
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for non-existent attachment")
        void deleteAttachment_NotFound_ThrowsException() {
            // When/Then
            assertThatThrownBy(() -> attachmentService.deleteAttachment(99999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("BlueprintAttachment");
        }
    }

    // ========================================================================
    // generateDownloadUrl Tests
    // ========================================================================

    @Nested
    @DisplayName("generateDownloadUrl()")
    class GenerateDownloadUrlTests {

        @Test
        @DisplayName("should generate presigned download URL for existing attachment")
        void generateDownloadUrl_Exists_ReturnsUrl() {
            // Given - Upload and register an attachment
            String objectKey = "blueprints/flow-" + flowId + "/node-" + NODE_ID + "/download-test.pdf";
            minioFileStorage.uploadFile(objectKey, "Download content".getBytes(), "application/pdf");
            Long attachmentId = attachmentService.registerAttachment(
                    flowId, NODE_ID, "download-test.pdf", 16L, objectKey, 1L
            );

            // When
            String downloadUrl = attachmentService.generateDownloadUrl(attachmentId, 15);

            // Then
            assertThat(downloadUrl).isNotBlank();
            assertThat(downloadUrl).contains("http");
            assertThat(downloadUrl).contains("download-test.pdf"); // File name in URL
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for non-existent attachment")
        void generateDownloadUrl_NotFound_ThrowsException() {
            // When/Then
            assertThatThrownBy(() -> attachmentService.generateDownloadUrl(99999L, 15))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("BlueprintAttachment");
        }
    }
}
