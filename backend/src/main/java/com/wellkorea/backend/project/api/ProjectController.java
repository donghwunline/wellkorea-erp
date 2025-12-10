package com.wellkorea.backend.project.api;

import com.wellkorea.backend.shared.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

/**
 * REST API controller for project management.
 * Provides endpoints for CRUD operations on projects and job codes.
 * <p>
 * This is a stub implementation to support integration tests.
 * Full implementation will be added as part of feature development.
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    /**
     * Get list of all projects.
     * <p>
     * Stub implementation returns empty list for testing purposes.
     * Requires authentication (tested by SecurityIntegrationTest).
     *
     * @return Empty list of projects wrapped in ApiResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Object>>> getAllProjects() {
        // Stub implementation - returns empty list
        // This endpoint exists to support SecurityIntegrationTest
        return ResponseEntity.ok(ApiResponse.success(Collections.emptyList()));
    }
}
