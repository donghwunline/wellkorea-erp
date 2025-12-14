package com.wellkorea.backend.auth.api;

import com.wellkorea.backend.auth.api.dto.UserResponse;
import com.wellkorea.backend.auth.application.CustomerAssignmentService;
import com.wellkorea.backend.auth.application.UserCommand;
import com.wellkorea.backend.auth.application.UserQuery;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Controller for user management endpoints.
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserQuery userQuery;
    private final UserCommand userCommand;
    private final CustomerAssignmentService customerAssignmentService;

    public UserController(UserQuery userQuery, UserCommand userCommand, CustomerAssignmentService customerAssignmentService) {
        this.userQuery = userQuery;
        this.userCommand = userCommand;
        this.customerAssignmentService = customerAssignmentService;
    }

    /**
     * GET /api/users
     * List all users with pagination.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponse>>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean activeOnly,
            Pageable pageable) {

        Page<UserResponse> users;

        if (search != null && !search.isBlank()) {
            users = userQuery.searchUsers(search, pageable);
        } else if (Boolean.TRUE.equals(activeOnly)) {
            users = userQuery.getActiveUsers(pageable);
        } else {
            users = userQuery.getAllUsers(pageable);
        }

        Map<String, Object> metadata = Map.of(
                "page", users.getNumber(),
                "size", users.getSize(),
                "totalElements", users.getTotalElements(),
                "totalPages", users.getTotalPages()
        );

        return ResponseEntity.ok(ApiResponse.successWithMetadata(users, metadata));
    }

    /**
     * GET /api/users/{id}
     * Get user by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
        return userQuery.getUserById(id)
                .map(user -> ResponseEntity.ok(ApiResponse.success(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/users
     * Create a new user.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@RequestBody CreateUserRequest request) {
        Set<Role> roles = request.roles() != null
                ? request.roles().stream().map(Role::fromName).collect(Collectors.toSet())
                : Set.of();

        Long userId = userCommand.createUser(
                request.username(),
                request.email(),
                request.password(),
                request.fullName(),
                roles
        );

        // Fetch the created user to return in response
        UserResponse createdUser = userQuery.getUserById(userId)
                .orElseThrow(() -> new IllegalStateException("Created user not found"));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(createdUser, "User created successfully"));
    }

    /**
     * PUT /api/users/{id}
     * Update user profile.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {

        // Check if user exists first
        userQuery.getUserById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        userCommand.updateUser(id, request.fullName(), request.email());

        // Fetch the updated user to return in response
        UserResponse updatedUser = userQuery.getUserById(id)
                .orElseThrow(() -> new IllegalStateException("Updated user not found"));

        return ResponseEntity.ok(ApiResponse.success(updatedUser, "User updated successfully"));
    }

    /**
     * PUT /api/users/{id}/roles
     * Assign roles to user.
     */
    @PutMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<Void>> assignRoles(
            @PathVariable Long id,
            @RequestBody AssignRolesRequest request) {

        Set<Role> roles = request.roles().stream()
                .map(Role::fromName)
                .collect(Collectors.toSet());

        userCommand.assignRoles(id, roles);

        return ResponseEntity.ok(ApiResponse.success(null, "Roles assigned successfully"));
    }

    /**
     * POST /api/users/{id}/activate
     * Activate a user.
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable Long id) {
        userCommand.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User activated successfully"));
    }

    /**
     * DELETE /api/users/{id}
     * Deactivate a user (soft delete).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {

        // Check if user exists first
        UserResponse targetUser = userQuery.getUserById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        // Prevent admin from deleting themselves
        if (targetUser.username().equals(currentUser.getUsername())) {
            throw new IllegalArgumentException("Cannot deactivate your own account");
        }

        userCommand.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/users/{id}/password
     * Change user password.
     */
    @PutMapping("/{id}/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request) {

        userCommand.changePassword(id, request.newPassword());

        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    }

    /**
     * GET /api/users/{id}/customers
     * Get customer assignments for a user.
     */
    @GetMapping("/{id}/customers")
    public ResponseEntity<ApiResponse<CustomerAssignmentsResponse>> getUserCustomers(@PathVariable Long id) {
        List<Long> customerIds = customerAssignmentService.getAssignedCustomerIds(id);
        return ResponseEntity.ok(ApiResponse.success(new CustomerAssignmentsResponse(customerIds)));
    }

    /**
     * PUT /api/users/{id}/customers
     * Replace all customer assignments for a user.
     */
    @PutMapping("/{id}/customers")
    public ResponseEntity<ApiResponse<Void>> assignCustomers(
            @PathVariable Long id,
            @RequestBody AssignCustomersRequest request) {

        customerAssignmentService.replaceUserAssignments(id, request.customerIds());
        return ResponseEntity.ok(ApiResponse.success(null, "Customer assignments updated successfully"));
    }

    // ==================== Request DTOs ====================

    public record CreateUserRequest(
            String username,
            String email,
            String password,
            String fullName,
            Set<String> roles
    ) {
    }

    public record UpdateUserRequest(
            String fullName,
            String email
    ) {
    }

    public record AssignRolesRequest(
            Set<String> roles
    ) {
    }

    public record ChangePasswordRequest(
            String newPassword
    ) {
    }

    public record AssignCustomersRequest(
            List<Long> customerIds
    ) {
    }

    public record CustomerAssignmentsResponse(
            List<Long> customerIds
    ) {
    }
}
