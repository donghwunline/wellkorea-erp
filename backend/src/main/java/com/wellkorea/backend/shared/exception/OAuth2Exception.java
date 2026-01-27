package com.wellkorea.backend.shared.exception;

/**
 * Exception for OAuth2-related errors.
 * Uses ErrorCode for consistent error handling and i18n support.
 *
 * <p>Unlike BusinessException which exposes messages to users,
 * OAuth2Exception returns only error codes in redirects to prevent
 * information leakage of OAuth2 flow details.
 */
public class OAuth2Exception extends RuntimeException {

    private final ErrorCode errorCode;

    public OAuth2Exception(ErrorCode errorCode) {
        super(errorCode.getDescription());
        this.errorCode = errorCode;
    }

    public OAuth2Exception(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getDescription(), cause);
        this.errorCode = errorCode;
    }

    public OAuth2Exception(ErrorCode errorCode, String additionalInfo) {
        super(errorCode.getDescription() + ": " + additionalInfo);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    /**
     * Get the error code string for use in redirect URLs.
     * Returns only the code (e.g., "OAUTH_001"), not the full message.
     */
    public String getCode() {
        return errorCode.getCode();
    }
}
