package com.wellkorea.backend.auth.infrastructure.config;

import com.wellkorea.backend.auth.api.CurrentToken;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Argument resolver for {@link CurrentToken} annotation.
 * Extracts JWT token from the Authorization header and injects it into controller method parameters.
 *
 * @deprecated since 1.0. This resolver is deprecated in favor of Spring Security's built-in
 *             authentication mechanisms. The planned replacement approach:
 *             <ul>
 *             <li>Use {@code @AuthenticationPrincipal} with a custom {@code UserDetails} implementation</li>
 *             <li>For JWT claims, use {@code Authentication.getCredentials()} or a custom
 *                 {@code JwtAuthenticationToken}</li>
 *             <li>Keycloak integration (planned) will provide OAuth2 resource server support
 *                 with automatic token validation</li>
 *             </ul>
 *             This class is retained for backward compatibility until the migration to OAuth2/Keycloak
 *             is complete. Not marked for removal as existing controllers may still depend on it.
 */
@Deprecated(since = "1.0", forRemoval = false)
@Component
public class CurrentTokenArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentToken.class)
                && parameter.getParameterType().equals(String.class);
    }

    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory) {

        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        if (request == null) {
            throw new IllegalStateException("HttpServletRequest is not available");
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid Authorization header");
        }

        return authHeader.substring(7);
    }
}
