package com.wellkorea.backend.core.purchasing.api;

import com.wellkorea.backend.core.purchasing.api.dto.command.*;
import com.wellkorea.backend.core.purchasing.api.dto.query.AttachmentReferenceView;
import com.wellkorea.backend.core.purchasing.api.dto.query.DownloadUrlResponse;
import com.wellkorea.backend.core.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.core.purchasing.api.dto.query.PurchaseRequestSummaryView;
import com.wellkorea.backend.core.purchasing.application.*;
import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.dto.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API controller for purchase request management.
 * Follows CQRS pattern - uses separate Command and Query services.
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Production: Full CRUD access
 * - Sales: Read-only access
 */
@RestController
@RequestMapping("/api/purchase-requests")
public class PurchaseRequestController {

    private final PurchaseRequestCommandService commandService;
    private final PurchaseRequestQueryService queryService;
    private final RfqEmailService rfqEmailService;
    private final ServicePRAttachmentService attachmentService;

    public PurchaseRequestController(PurchaseRequestCommandService commandService,
                                     PurchaseRequestQueryService queryService,
                                     RfqEmailService rfqEmailService,
                                     ServicePRAttachmentService attachmentService) {
        this.commandService = commandService;
        this.queryService = queryService;
        this.rfqEmailService = rfqEmailService;
        this.attachmentService = attachmentService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * List purchase requests with optional filters (paginated).
     * <p>
     * GET /api/purchase-requests
     * GET /api/purchase-requests?status=DRAFT
     * GET /api/purchase-requests?projectId=123
     * GET /api/purchase-requests?dtype=SERVICE
     * GET /api/purchase-requests?dtype=MATERIAL
     * GET /api/purchase-requests?status=RFQ_SENT&projectId=123&dtype=SERVICE
     * <p>
     * Access: All authenticated users
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PurchaseRequestSummaryView>>> listPurchaseRequests(@RequestParam(required = false) String status,
                                                                                              @RequestParam(required = false) Long projectId,
                                                                                              @RequestParam(required = false) String dtype,
                                                                                              Pageable pageable) {

        Page<PurchaseRequestSummaryView> result = queryService.listPurchaseRequests(status, projectId, dtype, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Get purchase request by ID.
     * <p>
     * GET /api/purchase-requests/{id}
     * <p>
     * Access: All authenticated users
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseRequestDetailView>> getPurchaseRequest(@PathVariable Long id) {
        PurchaseRequestDetailView detail = queryService.getPurchaseRequestDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Create a new service purchase request (outsourcing).
     * <p>
     * POST /api/purchase-requests/service
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/service")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> createServicePurchaseRequest(
            @Valid @RequestBody CreateServicePurchaseRequestRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
        Long id = commandService.createServicePurchaseRequest(request.toCommand(), userId);
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.created(id);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    /**
     * Create a new material purchase request (physical items).
     * <p>
     * POST /api/purchase-requests/material
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/material")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> createMaterialPurchaseRequest(
            @Valid @RequestBody CreateMaterialPurchaseRequestRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
        Long id = commandService.createMaterialPurchaseRequest(request.toCommand(), userId);
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.created(id);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    /**
     * Update a purchase request.
     * <p>
     * PUT /api/purchase-requests/{id}
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> updatePurchaseRequest(@PathVariable Long id,
                                                                                           @Valid @RequestBody UpdatePurchaseRequestRequest request) {

        Long updatedId = commandService.updatePurchaseRequest(id, request.toCommand());
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.updated(updatedId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Send RFQ to vendors with email notifications.
     * <p>
     * POST /api/purchase-requests/{id}/send-rfq
     * <p>
     * Creates RFQ items for each vendor, transitions status to RFQ_SENT,
     * and sends email notifications with PDF attachment.
     * If some email sends fail, the RFQ items are still created.
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/{id}/send-rfq")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> sendRfq(@PathVariable Long id,
                                                                             @Valid @RequestBody SendRfqRequest request) {

        // Create RFQ items and transition status
        List<String> itemIds = commandService.sendRfq(id, request.vendorIds());

        // Build vendor email map for email service
        Map<Long, RfqEmailService.VendorEmailInfo> vendorEmailMap = new HashMap<>();
        for (Long vendorId : request.vendorIds()) {
            if (request.vendorEmails() != null && request.vendorEmails().containsKey(vendorId)) {
                SendRfqRequest.VendorEmailInfo emailInfo = request.vendorEmails().get(vendorId);
                vendorEmailMap.put(vendorId, new RfqEmailService.VendorEmailInfo(
                        emailInfo.to(),
                        emailInfo.ccEmails()
                ));
            } else {
                vendorEmailMap.put(vendorId, RfqEmailService.VendorEmailInfo.empty());
            }
        }

        // Send email notifications (partial failures are handled internally)
        RfqEmailService.RfqEmailResult emailResult = rfqEmailService.sendRfqEmails(id, vendorEmailMap);

        // Return success even if some emails failed (RFQ items are created)
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.rfqSent(
                id,
                itemIds.size(),
                emailResult.successCount(),
                emailResult.failureCount()
        );

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Cancel a purchase request.
     * <p>
     * DELETE /api/purchase-requests/{id}
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<Void> cancelPurchaseRequest(@PathVariable Long id) {
        commandService.cancelPurchaseRequest(id);
        return ResponseEntity.noContent().build();
    }

    // ========== ATTACHMENT QUERY ENDPOINTS ==========

    /**
     * List linked attachments for a purchase request.
     * Returns empty list for MaterialPurchaseRequest (no attachment support).
     * <p>
     * GET /api/purchase-requests/{id}/attachments
     * <p>
     * Access: All authenticated users
     */
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentReferenceView>>> getLinkedAttachments(@PathVariable Long id) {
        List<AttachmentReferenceView> attachments = attachmentService.getLinkedAttachments(id);
        return ResponseEntity.ok(ApiResponse.success(attachments));
    }

    /**
     * Generate presigned download URL for an attachment.
     * <p>
     * GET /api/purchase-requests/{id}/attachments/{referenceId}/url
     * <p>
     * Access: All authenticated users
     */
    @GetMapping("/{id}/attachments/{referenceId}/url")
    public ResponseEntity<ApiResponse<DownloadUrlResponse>> getDownloadUrl(@PathVariable Long id,
                                                                           @PathVariable String referenceId) {
        String url = attachmentService.generateDownloadUrl(id, referenceId);
        return ResponseEntity.ok(ApiResponse.success(new DownloadUrlResponse(url)));
    }

    // ========== ATTACHMENT COMMAND ENDPOINTS ==========

    /**
     * Link an existing file (from TaskFlow blueprint) to a ServicePurchaseRequest.
     * Only allowed for SERVICE type purchase requests.
     * <p>
     * POST /api/purchase-requests/{id}/attachments/link
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/{id}/attachments/link")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<AttachmentCommandResult>> linkAttachment(
            @PathVariable Long id,
            @Valid @RequestBody LinkAttachmentRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        LinkAttachmentCommand command = new LinkAttachmentCommand(
                request.fileName(),
                request.fileType(),
                request.fileSize(),
                request.storagePath()
        );
        String referenceId = attachmentService.linkAttachment(id, command, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(AttachmentCommandResult.linked(referenceId)));
    }

    /**
     * Unlink an attachment from a ServicePurchaseRequest.
     * Does not delete the actual file (it belongs to TaskFlow).
     * <p>
     * DELETE /api/purchase-requests/{id}/attachments/{referenceId}
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @DeleteMapping("/{id}/attachments/{referenceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<AttachmentCommandResult>> unlinkAttachment(@PathVariable Long id,
                                                                                 @PathVariable String referenceId) {
        attachmentService.unlinkAttachment(id, referenceId);
        return ResponseEntity.ok(ApiResponse.success(AttachmentCommandResult.unlinked(referenceId)));
    }
}
