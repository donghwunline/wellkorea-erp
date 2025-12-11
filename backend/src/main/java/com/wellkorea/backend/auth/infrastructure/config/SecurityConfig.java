package com.wellkorea.backend.auth.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellkorea.backend.shared.dto.ErrorResponse;
import com.wellkorea.backend.shared.exception.ErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration for JWT-based authentication and RBAC.
 * <p>
 * Security Features:
 * - JWT token-based authentication (stateless)
 * - Method-level security (@PreAuthorize annotations)
 * - CORS configuration for frontend
 * - CSRF disabled (REST API with JWT)
 * - Role-based access control (ADMIN, FINANCE, PRODUCTION, SALES)
 * <p>
 * TEMPORARY: This configuration will be replaced with OAuth2 Resource Server
 * when Keycloak integration is implemented. See docs/keycloak-migration.md.
 * <p>
 * Migration Path:
 * 1. Comment out JWT filter chain
 * 2. Enable OAuth2 Resource Server configuration
 * 3. Update application.yml with Keycloak issuer-uri
 * 4. Keep User/Role entities for RBAC
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    @Value("${security.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Value("${security.cors.allowed-headers}")
    private String[] allowedHeaders;

    @Value("${security.swagger.enabled}")
    private boolean swaggerEnabled;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    /**
     * Security filter chain configuration.
     * Defines authentication/authorization rules for all HTTP requests.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF (not needed for stateless JWT API)
                .csrf(AbstractHttpConfigurer::disable)

                // Enable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Stateless session (JWT tokens, no server-side sessions)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Authorization rules
                .authorizeHttpRequests(auth -> {
                    // Public endpoints (no authentication required)
                    auth.requestMatchers("/api/auth/login", "/api/auth/register").permitAll();
                    auth.requestMatchers("/actuator/health", "/actuator/info").permitAll();
                    auth.requestMatchers("/error").permitAll();

                    // Swagger/OpenAPI (profile-conditional)
                    if (swaggerEnabled) {
                        auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                    } else {
                        auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").denyAll();
                    }

                    // All other requests require authentication
                    auth.anyRequest().authenticated();
                })

                // Exception handling - return 401 for unauthenticated requests
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.setCharacterEncoding("UTF-8");

                            ErrorResponse errorResponse = ErrorResponse.of(
                                    ErrorCode.AUTHENTICATION_FAILED,
                                    "Authentication required",
                                    request.getRequestURI()
                            );

                            response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
                        })
                )

                // Add JWT filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS configuration for frontend access.
     * Allowed origins configured via property: security.cors.allowed-origins
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow specific origins from configuration
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));

        // Allow all HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Allow configured headers (explicit list for security)
        configuration.setAllowedHeaders(Arrays.asList(allowedHeaders));

        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Expose Authorization header
        configuration.setExposedHeaders(List.of("Authorization"));

        // Max age for preflight requests
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Password encoder bean.
     * Uses BCrypt hashing algorithm with default strength (10 rounds).
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Authentication manager bean.
     * Required for login authentication.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
