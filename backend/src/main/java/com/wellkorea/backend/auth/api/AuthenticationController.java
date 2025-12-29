package com.wellkorea.backend.auth.api;

import com.wellkorea.backend.auth.api.dto.LoginRequest;
import com.wellkorea.backend.auth.api.dto.LoginResponse;
import com.wellkorea.backend.auth.application.AuthenticationService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for authentication endpoints.
 * Handles login, logout, token refresh, and current user retrieval.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    /**
     * POST /api/auth/login
     * Authenticate user and return JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {

        LoginResponse response = authenticationService.login(request.username(), request.password());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/auth/logout
     * Invalidate the current token.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@CurrentToken String token) {
        authenticationService.logout(token);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    /**
     * POST /api/auth/refresh
     * Refresh the current token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(@CurrentToken String token) {
        LoginResponse response = authenticationService.refreshToken(token);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/auth/me
     * Get current authenticated user info.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse.UserInfo>> getCurrentUser(@CurrentToken String token) {
        LoginResponse.UserInfo userInfo = authenticationService.getCurrentUser(token);
        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }
}
