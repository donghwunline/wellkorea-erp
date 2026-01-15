package com.wellkorea.backend.purchasing.api;

import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import com.wellkorea.backend.purchasing.api.dto.command.*;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderSummaryView;
import com.wellkorea.backend.purchasing.application.PurchaseOrderCommandService;
import com.wellkorea.backend.purchasing.application.PurchaseOrderQueryService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST API controller for purchase order management.
 * Follows CQRS pattern - uses separate Command and Query services.
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Production: Full CRUD access
 * - Sales: Read-only access
 */
@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderCommandService commandService;
    private final PurchaseOrderQueryService queryService;

    public PurchaseOrderController(PurchaseOrderCommandService commandService,
                                   PurchaseOrderQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * List all purchase orders (paginated).
     * <p>
     * GET /api/purchase-orders
     * <p>
     * Access: All authenticated users
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PurchaseOrderSummaryView>>> listPurchaseOrders(
            @RequestParam(required = false) Long vendorId,
            @RequestParam(required = false) String status,
            Pageable pageable) {

        Page<PurchaseOrderSummaryView> result;

        if (vendorId != null) {
            result = queryService.listByVendorId(vendorId, pageable);
        } else if (status != null) {
            result = queryService.listByStatus(status, pageable);
        } else {
            result = queryService.listPurchaseOrders(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Get purchase order by ID.
     * <p>
     * GET /api/purchase-orders/{id}
     * <p>
     * Access: All authenticated users
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrderDetailView>> getPurchaseOrder(@PathVariable Long id) {
        PurchaseOrderDetailView detail = queryService.getPurchaseOrderDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Create a new purchase order from RFQ item.
     * <p>
     * POST /api/purchase-orders
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseOrderCommandResult>> createPurchaseOrder(
            @Valid @RequestBody CreatePurchaseOrderRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
        Long id = commandService.createPurchaseOrder(request.toCommand(), userId);
        PurchaseOrderCommandResult result = PurchaseOrderCommandResult.created(id);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    /**
     * Update a purchase order.
     * <p>
     * PUT /api/purchase-orders/{id}
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseOrderCommandResult>> updatePurchaseOrder(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePurchaseOrderRequest request) {

        Long updatedId = commandService.updatePurchaseOrder(id, request.toCommand());
        PurchaseOrderCommandResult result = PurchaseOrderCommandResult.updated(updatedId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Send a purchase order to vendor.
     * <p>
     * POST /api/purchase-orders/{id}/send
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseOrderCommandResult>> sendPurchaseOrder(@PathVariable Long id) {
        Long sentId = commandService.sendPurchaseOrder(id);
        PurchaseOrderCommandResult result = PurchaseOrderCommandResult.sent(sentId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Confirm a purchase order (vendor confirmation).
     * <p>
     * POST /api/purchase-orders/{id}/confirm
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseOrderCommandResult>> confirmPurchaseOrder(@PathVariable Long id) {
        Long confirmedId = commandService.confirmPurchaseOrder(id);
        PurchaseOrderCommandResult result = PurchaseOrderCommandResult.confirmed(confirmedId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Mark purchase order as received.
     * <p>
     * POST /api/purchase-orders/{id}/receive
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseOrderCommandResult>> receivePurchaseOrder(@PathVariable Long id) {
        Long receivedId = commandService.receivePurchaseOrder(id);
        PurchaseOrderCommandResult result = PurchaseOrderCommandResult.received(receivedId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Cancel a purchase order.
     * <p>
     * DELETE /api/purchase-orders/{id}
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<Void> cancelPurchaseOrder(@PathVariable Long id) {
        commandService.cancelPurchaseOrder(id);
        return ResponseEntity.noContent().build();
    }
}
