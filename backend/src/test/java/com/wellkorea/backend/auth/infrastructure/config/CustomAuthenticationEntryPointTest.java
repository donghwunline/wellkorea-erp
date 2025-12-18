package com.wellkorea.backend.auth.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.wellkorea.backend.shared.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.AuthenticationException;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for CustomAuthenticationEntryPoint.
 * Tests error code differentiation for expired vs invalid tokens.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
class CustomAuthenticationEntryPointTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    private CustomAuthenticationEntryPoint entryPoint;
    private ObjectMapper objectMapper;
    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        entryPoint = new CustomAuthenticationEntryPoint(objectMapper);

        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
    }

    @Test
    void shouldReturnAuth003ForExpiredToken() throws Exception {
        // Given: ExpiredJwtAuthenticationException
        ExpiredJwtAuthenticationException authException = new ExpiredJwtAuthenticationException("Token has expired");
        when(request.getRequestURI()).thenReturn("/api/users");

        // When: Entry point handles authentication failure
        entryPoint.commence(request, response, authException);

        // Then: Response has 401 status
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(response).setContentType("application/json");
        verify(response).setCharacterEncoding("UTF-8");

        // And: Error response contains AUTH_003
        String jsonResponse = responseWriter.toString();
        assertThat(jsonResponse).contains("AUTH_003");
        assertThat(jsonResponse).contains("expired");
    }

    @Test
    void shouldReturnAuth002ForInvalidToken() throws Exception {
        // Given: InvalidJwtAuthenticationException
        InvalidJwtAuthenticationException authException = new InvalidJwtAuthenticationException("Invalid token");
        when(request.getRequestURI()).thenReturn("/api/projects");

        // When: Entry point handles authentication failure
        entryPoint.commence(request, response, authException);

        // Then: Response has 401 status
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // And: Error response contains AUTH_002
        String jsonResponse = responseWriter.toString();
        assertThat(jsonResponse).contains("AUTH_002");
        assertThat(jsonResponse).contains("Invalid");
    }

    @Test
    void shouldDefaultToAuth001WhenGenericAuthException() throws Exception {
        // Given: Generic Spring Security AuthenticationException (not our custom types)
        AuthenticationException authException = new AuthenticationException("Authentication failed") {
        };
        when(request.getRequestURI()).thenReturn("/api/users");

        // When: Entry point handles authentication failure
        entryPoint.commence(request, response, authException);

        // Then: Error response contains AUTH_001 (default)
        String jsonResponse = responseWriter.toString();
        assertThat(jsonResponse).contains("AUTH_001");
        assertThat(jsonResponse).contains("Authentication");
    }


    @Test
    void shouldReturnValidErrorResponseStructure() throws Exception {
        // Given: ExpiredJwtAuthenticationException
        ExpiredJwtAuthenticationException authException = new ExpiredJwtAuthenticationException("Token has expired");
        when(request.getRequestURI()).thenReturn("/api/test");

        // When: Entry point handles authentication failure
        entryPoint.commence(request, response, authException);

        // Then: Response can be parsed as ErrorResponse
        String jsonResponse = responseWriter.toString();
        ErrorResponse errorResponse = objectMapper.readValue(jsonResponse, ErrorResponse.class);

        assertThat(errorResponse).isNotNull();
        assertThat(errorResponse.status()).isEqualTo(401);
        assertThat(errorResponse.errorCode()).isEqualTo("AUTH_003");
        assertThat(errorResponse.message()).isNotBlank();
        assertThat(errorResponse.path()).isEqualTo("/api/test");
        assertThat(errorResponse.timestamp()).isNotNull();
    }
}
