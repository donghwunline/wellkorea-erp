package com.wellkorea.backend.auth.api;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to inject the current JWT token from the Authorization header.
 * Use on String parameters in controller methods to automatically extract and validate the Bearer token.
 *
 * <p>Example:
 * <pre>
 * {@code
 * @PostMapping("/logout")
 * public ResponseEntity<ApiResponse<Void>> logout(@CurrentToken String token) {
 *     authenticationService.logout(token);
 *     return ResponseEntity.ok(ApiResponse.success(null));
 * }
 * }
 * </pre>
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentToken {
}
