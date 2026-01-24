package com.wellkorea.backend.production.api;

import com.wellkorea.backend.production.api.dto.command.BlueprintCommandResult;
import com.wellkorea.backend.shared.storage.api.dto.RegisterAttachmentRequest;
import com.wellkorea.backend.shared.storage.api.dto.UploadUrlRequest;
import com.wellkorea.backend.shared.storage.api.dto.UploadUrlResponse;
import com.wellkorea.backend.production.api.dto.query.BlueprintAttachmentView;
import com.wellkorea.backend.production.application.BlueprintAttachmentService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.dto.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for blueprint attachment operations.
 * Handles file uploads/downloads for TaskFlow nodes using presigned URLs.
 * <p>
 * Upload Flow (Direct to MinIO):
 * 1. POST /api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url - Get presigned upload URL
 * 2. Client uploads directly to MinIO using presigned URL
 * 3. POST /api/task-flows/{flowId}/nodes/{nodeId}/attachments/register - Register uploaded file
 * <p>
 * Endpoints:
 * - GET    /api/task-flows/{flowId}/attachments                    - List all attachments for a flow
 * - GET    /api/task-flows/{flowId}/nodes/{nodeId}/attachments     - List attachments for a node
 * - POST   /api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url - Get presigned upload URL
 * - POST   /api/task-flows/{flowId}/nodes/{nodeId}/attachments/register   - Register uploaded file
 * - GET    /api/blueprints/{id}                                    - Get attachment metadata
 * - GET    /api/blueprints/{id}/download                           - Download attachment file (proxy)
 * - GET    /api/blueprints/{id}/url                                - Get presigned download URL
 * - DELETE /api/blueprints/{id}                                    - Delete attachment
 */
@RestController
@RequestMapping("/api")
public class BlueprintAttachmentController {

    private final BlueprintAttachmentService attachmentService;

    public BlueprintAttachmentController(BlueprintAttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * List all attachments for a TaskFlow.
     * GET /api/task-flows/{flowId}/attachments
     */
    @GetMapping("/task-flows/{flowId}/attachments")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION', 'SALES')")
    public ResponseEntity<ApiResponse<List<BlueprintAttachmentView>>> listAttachmentsByFlow(@PathVariable Long flowId) {
        List<BlueprintAttachmentView> attachments = attachmentService.getAttachmentsByFlow(flowId);
        return ResponseEntity.ok(ApiResponse.success(attachments));
    }

    /**
     * List attachments for a specific node.
     * GET /api/task-flows/{flowId}/nodes/{nodeId}/attachments
     */
    @GetMapping("/task-flows/{flowId}/nodes/{nodeId}/attachments")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION', 'SALES')")
    public ResponseEntity<ApiResponse<List<BlueprintAttachmentView>>> listAttachmentsByNode(@PathVariable Long flowId,
                                                                                            @PathVariable String nodeId) {
        List<BlueprintAttachmentView> attachments = attachmentService.getAttachmentsByNode(flowId, nodeId);
        return ResponseEntity.ok(ApiResponse.success(attachments));
    }

    

    /**
     * Get attachment metadata by ID.
     * GET /api/blueprints/{id}
     */
    @GetMapping("/blueprints/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION', 'SALES')")
    public ResponseEntity<ApiResponse<BlueprintAttachmentView>> getAttachment(@PathVariable Long id) {
        BlueprintAttachmentView attachment = attachmentService.getAttachment(id);
        return ResponseEntity.ok(ApiResponse.success(attachment));
    }

    /**
     * Download attachment file.
     * GET /api/blueprints/{id}/download
     */
    @GetMapping("/blueprints/{id}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION', 'SALES')")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long id) {
        BlueprintAttachmentView attachment = attachmentService.getAttachment(id);
        byte[] content = attachmentService.downloadAttachment(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + attachment.fileName() + "\"")
                .contentType(MediaType.parseMediaType(attachment.fileType().getMimeType()))
                .contentLength(attachment.fileSize())
                .body(content);
    }

    /**
     * Get presigned download URL (valid for 15 minutes).
     * GET /api/blueprints/{id}/url
     */
    @GetMapping("/blueprints/{id}/url")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION', 'SALES')")
    public ResponseEntity<ApiResponse<String>> getDownloadUrl(@PathVariable Long id,
                                                              @RequestParam(defaultValue = "15") int expiryMinutes) {
        String url = attachmentService.generateDownloadUrl(id, expiryMinutes);
        return ResponseEntity.ok(ApiResponse.success(url));
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Get presigned URL for direct upload to MinIO.
     * Client uses this URL to upload file directly to MinIO without proxying through backend.
     * POST /api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url
     */
    @PostMapping("/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<UploadUrlResponse>> getUploadUrl(@PathVariable Long flowId,
                                                                       @PathVariable String nodeId,
                                                                       @Valid @RequestBody UploadUrlRequest request) {
        UploadUrlResponse response = attachmentService.generateUploadUrl(
                flowId, nodeId, request.fileName(), request.fileSize(), request.contentType());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Register an attachment after direct upload to MinIO.
     * Called by client after successfully uploading file to MinIO using presigned URL.
     * POST /api/task-flows/{flowId}/nodes/{nodeId}/attachments/register
     */
    @PostMapping("/task-flows/{flowId}/nodes/{nodeId}/attachments/register")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<BlueprintCommandResult>> registerAttachment(@PathVariable Long flowId,
                                                                                  @PathVariable String nodeId,
                                                                                  @Valid @RequestBody RegisterAttachmentRequest request,
                                                                                  @AuthenticationPrincipal AuthenticatedUser user) {
        Long attachmentId = attachmentService.registerAttachment(
                flowId, nodeId, request.fileName(), request.fileSize(), request.objectKey(), user.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(BlueprintCommandResult.uploaded(attachmentId)));
    }

    /**
     * Delete an attachment.
     * DELETE /api/blueprints/{id}
     */
    @DeleteMapping("/blueprints/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<BlueprintCommandResult>> deleteAttachment(@PathVariable Long id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.ok(ApiResponse.success(BlueprintCommandResult.deleted(id)));
    }
}
