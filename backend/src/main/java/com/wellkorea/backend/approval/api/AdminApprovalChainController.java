package com.wellkorea.backend.approval.api;

import com.wellkorea.backend.approval.api.dto.*;
import com.wellkorea.backend.approval.application.ApprovalService;
import com.wellkorea.backend.approval.application.ChainLevelCommand;
import com.wellkorea.backend.approval.domain.ApprovalChainTemplate;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for admin approval chain configuration.
 * Provides endpoints for managing approval chain templates and levels.
 */
@RestController
@RequestMapping("/api/admin/approval-chains")
@PreAuthorize("hasRole('ADMIN')")
public class AdminApprovalChainController {

    private final ApprovalService approvalService;

    public AdminApprovalChainController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    /**
     * List all approval chain templates.
     * GET /api/admin/approval-chains
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChainTemplateResponse>>> listChainTemplates() {
        var templates = approvalService.listChainTemplates();
        var response = templates.stream()
                .map(ChainTemplateResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get chain template by ID.
     * GET /api/admin/approval-chains/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ChainTemplateResponse>> getChainTemplate(@PathVariable Long id) {
        var templates = approvalService.listChainTemplates();
        var template = templates.stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new com.wellkorea.backend.shared.exception.ResourceNotFoundException(
                        "Chain template not found with ID: " + id));

        return ResponseEntity.ok(ApiResponse.success(ChainTemplateResponse.from(template)));
    }

    /**
     * Update chain levels for a template.
     * PUT /api/admin/approval-chains/{id}/levels
     */
    @PutMapping("/{id}/levels")
    public ResponseEntity<ApiResponse<ChainTemplateResponse>> updateChainLevels(
            @PathVariable Long id,
            @Valid @RequestBody UpdateChainLevelsRequest request) {

        var commands = request.levels().stream()
                .map(l -> new ChainLevelCommand(
                        l.levelOrder(),
                        l.levelName(),
                        l.approverUserId(),
                        l.isRequired()))
                .toList();

        ApprovalChainTemplate template = approvalService.updateChainLevels(id, commands);
        ChainTemplateResponse response = ChainTemplateResponse.from(template);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
