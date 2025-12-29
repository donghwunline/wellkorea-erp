package com.wellkorea.backend.auth.api;

import com.wellkorea.backend.auth.domain.AuthenticatedUser;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to inject the current JWT token from the Authorization header.
 * Use on String parameters in controller methods to automatically extract and validate the Bearer token.
 *
 * <p><b>DEPRECATED:</b> Use {@code @AuthenticationPrincipal AuthenticatedUser} instead for accessing
 * user information. The {@link AuthenticatedUser} class provides direct access to userId, username,
 * and roles without needing to parse the token.
 *
 * <p>This annotation should only be used in {@code AuthenticationController} for operations
 * that require the raw token string (logout, refresh).
 *
 * <p><b>Recommended pattern:</b>
 * <pre>
 * {@code
 * // BEFORE (deprecated):
 * @PostMapping
 * public ResponseEntity<?> create(@CurrentToken String token) {
 *     Long userId = jwtTokenProvider.getUserId(token);
 *     // ...
 * }
 *
 * // AFTER (preferred):
 * @PostMapping
 * public ResponseEntity<?> create(@AuthenticationPrincipal AuthenticatedUser user) {
 *     Long userId = user.getUserId();
 *     // ...
 * }
 * }
 * </pre>
 *
 * @see AuthenticatedUser
 * @deprecated Use {@code @AuthenticationPrincipal AuthenticatedUser} instead.
 * Only kept for AuthenticationController where raw token access is required.
 */
@Deprecated(since = "1.0", forRemoval = false)
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentToken {
}
