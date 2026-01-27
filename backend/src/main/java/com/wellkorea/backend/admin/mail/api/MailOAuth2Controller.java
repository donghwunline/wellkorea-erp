package com.wellkorea.backend.admin.mail.api;

import com.wellkorea.backend.admin.mail.api.dto.AuthorizeUrlResponse;
import com.wellkorea.backend.admin.mail.api.dto.MailConfigStatusResponse;
import com.wellkorea.backend.admin.mail.application.MailOAuth2Service;
import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.dto.AuthenticatedUser;
import com.wellkorea.backend.shared.exception.ErrorCode;
import com.wellkorea.backend.shared.exception.OAuth2Exception;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

/**
 * REST controller for mail OAuth2 configuration.
 * Allows admin users to connect/disconnect Microsoft Graph for mail sending.
 */
@RestController
@RequestMapping("/api/admin/mail/oauth2")
public class MailOAuth2Controller {

    private static final Logger log = LoggerFactory.getLogger(MailOAuth2Controller.class);

    private final MailOAuth2Service oAuth2Service;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public MailOAuth2Controller(MailOAuth2Service oAuth2Service) {
        this.oAuth2Service = oAuth2Service;
    }

    // ==================== QUERY ENDPOINTS ====================

    /**
     * Get current mail OAuth2 connection status.
     * GET /api/admin/mail/oauth2/status
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MailConfigStatusResponse>> getStatus() {
        var status = oAuth2Service.getStatus();
        var response = new MailConfigStatusResponse(
                status.connected(),
                status.senderEmail(),
                status.connectedAt(),
                status.connectedById(),
                oAuth2Service.isMicrosoftConfigured()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get Microsoft OAuth2 authorization URL.
     * GET /api/admin/mail/oauth2/authorize
     */
    @GetMapping("/authorize")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuthorizeUrlResponse>> getAuthorizationUrl(
            @AuthenticationPrincipal AuthenticatedUser user) {
        Long userId = user.getUserId();
        String url = oAuth2Service.generateAuthorizationUrl(userId);
        return ResponseEntity.ok(ApiResponse.success(new AuthorizeUrlResponse(url)));
    }

    // ==================== CALLBACK ENDPOINT (Public) ====================

    /**
     * Handle Microsoft OAuth2 callback.
     * GET /api/admin/mail/oauth2/callback?code=X&state=Y
     *
     * <p>This endpoint is public because Microsoft redirects here after authorization.
     * Security is handled via the state parameter (CSRF protection).
     *
     * <p>Error handling returns only error codes (not messages) in the redirect URL
     * to prevent information leakage. Frontend translates codes to user messages.
     */
    @GetMapping("/callback")
    public void handleCallback(
            @RequestParam String code,
            @RequestParam String state,
            HttpServletResponse response) throws IOException {

        try {
            oAuth2Service.handleCallback(code, state);
            // Redirect to frontend settings page with success
            response.sendRedirect(frontendUrl + "/admin/settings/mail?success=true");

        } catch (OAuth2Exception e) {
            log.error("OAuth2 callback failed: {} - {}", e.getCode(), e.getMessage());
            // Return only error code, not message (prevents information leakage)
            response.sendRedirect(frontendUrl + "/admin/settings/mail?error=" + e.getCode());

        } catch (Exception e) {
            log.error("Unexpected OAuth2 error", e);
            // Generic server error code for unexpected errors
            response.sendRedirect(frontendUrl + "/admin/settings/mail?error=" + ErrorCode.INTERNAL_SERVER_ERROR.getCode());
        }
    }

    // ==================== COMMAND ENDPOINTS ====================

    /**
     * Disconnect mail OAuth2 configuration.
     * DELETE /api/admin/mail/oauth2
     */
    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> disconnect() {
        oAuth2Service.disconnect();
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
