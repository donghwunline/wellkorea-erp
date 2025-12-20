package com.wellkorea.backend.approval.api;

import com.wellkorea.backend.approval.api.dto.query.ChainTemplateView;
import com.wellkorea.backend.approval.api.dto.command.UpdateChainLevelsRequest;
import com.wellkorea.backend.approval.api.dto.command.ApprovalCommandResult;
import com.wellkorea.backend.approval.application.ApprovalCommandService;
import com.wellkorea.backend.approval.application.ApprovalQueryService;
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
 * Follows CQRS pattern - uses separate Command and Query services.
 */
@RestController
@RequestMapping("/api/admin/approval-chains")
@PreAuthorize("hasRole('ADMIN')")
public class AdminApprovalChainController {

    private final ApprovalCommandService commandService;
    private final ApprovalQueryService queryService;

    public AdminApprovalChainController(
            ApprovalCommandService commandService,
            ApprovalQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    // ==================== QUERY ENDPOINTS ====================

    /**
     * List all approval chain templates.
     * GET /api/admin/approval-chains
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChainTemplateView>>> listChainTemplates() {
        var templates = queryService.listChainTemplates();
        var response = templates.stream()
                .map(ChainTemplateView::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get chain template by ID.
     * GET /api/admin/approval-chains/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ChainTemplateView>> getChainTemplate(@PathVariable Long id) {
        ApprovalChainTemplate template = queryService.getChainTemplate(id);
        return ResponseEntity.ok(ApiResponse.success(ChainTemplateView.from(template)));
    }

    // ==================== COMMAND ENDPOINTS ====================

    /**
     * Update chain levels for a template.
     * PUT /api/admin/approval-chains/{id}/levels
     */
    @PutMapping("/{id}/levels")
    public ResponseEntity<ApiResponse<ApprovalCommandResult>> updateChainLevels(
            @PathVariable Long id,
            @Valid @RequestBody UpdateChainLevelsRequest request) {

        var commands = request.levels().stream()
                .map(l -> new ChainLevelCommand(
                        l.levelOrder(),
                        l.levelName(),
                        l.approverUserId(),
                        l.isRequired()))
                .toList();

        Long chainId = commandService.updateChainLevels(id, commands);
        ApprovalCommandResult result = ApprovalCommandResult.chainUpdated(chainId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
