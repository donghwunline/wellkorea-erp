package com.wellkorea.backend.shared.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CorrelationIdFilter.
 * Tests correlation ID extraction from headers, UUID generation for missing headers,
 * MDC population/cleanup, and response header setting.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
class CorrelationIdFilterTest {

    private static final String REQUEST_HEADER = "X-Request-ID";
    private static final String MDC_KEY = "correlationId";

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private CorrelationIdFilter correlationIdFilter;

    @BeforeEach
    void setUp() {
        correlationIdFilter = new CorrelationIdFilter();
        MDC.clear();
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    // ========== Header Present Tests ==========

    @Test
    void shouldUseProvidedCorrelationIdFromHeader() throws ServletException, IOException {
        // Given: Request with X-Request-ID header
        String providedCorrelationId = "test-correlation-id-123";
        when(request.getHeader(REQUEST_HEADER)).thenReturn(providedCorrelationId);

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: Response header set with provided correlation ID
        verify(response).setHeader(REQUEST_HEADER, providedCorrelationId);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldSetMdcWithProvidedCorrelationId() throws ServletException, IOException {
        // Given: Request with X-Request-ID header
        String providedCorrelationId = "mdc-test-id-456";
        when(request.getHeader(REQUEST_HEADER)).thenReturn(providedCorrelationId);

        // Capture MDC value during filter chain execution
        AtomicReference<String> mdcValueDuringRequest = new AtomicReference<>();
        doAnswer(invocation -> {
            mdcValueDuringRequest.set(MDC.get(MDC_KEY));
            return null;
        }).when(filterChain).doFilter(request, response);

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: MDC was set during filter chain execution
        assertThat(mdcValueDuringRequest.get()).isEqualTo(providedCorrelationId);
    }

    // ========== Header Missing Tests ==========

    @Test
    void shouldGenerateUuidWhenHeaderMissing() throws ServletException, IOException {
        // Given: No X-Request-ID header
        when(request.getHeader(REQUEST_HEADER)).thenReturn(null);

        // Capture the correlation ID set in response header
        AtomicReference<String> generatedId = new AtomicReference<>();
        doAnswer(invocation -> {
            generatedId.set(invocation.getArgument(1));
            return null;
        }).when(response).setHeader(eq(REQUEST_HEADER), anyString());

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: Generated correlation ID is a valid UUID
        assertThat(generatedId.get()).isNotNull();
        assertThat(UUID.fromString(generatedId.get())).isNotNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldSetMdcWithGeneratedUuid() throws ServletException, IOException {
        // Given: No X-Request-ID header
        when(request.getHeader(REQUEST_HEADER)).thenReturn(null);

        // Capture MDC value during filter chain execution
        AtomicReference<String> mdcValueDuringRequest = new AtomicReference<>();
        doAnswer(invocation -> {
            mdcValueDuringRequest.set(MDC.get(MDC_KEY));
            return null;
        }).when(filterChain).doFilter(request, response);

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: MDC was set with a valid UUID
        assertThat(mdcValueDuringRequest.get()).isNotNull();
        assertThat(UUID.fromString(mdcValueDuringRequest.get())).isNotNull();
    }

    // ========== Empty/Blank Header Tests ==========

    @Test
    void shouldGenerateUuidWhenHeaderEmpty() throws ServletException, IOException {
        // Given: Empty X-Request-ID header
        when(request.getHeader(REQUEST_HEADER)).thenReturn("");

        // Capture the correlation ID set in response header
        AtomicReference<String> generatedId = new AtomicReference<>();
        doAnswer(invocation -> {
            generatedId.set(invocation.getArgument(1));
            return null;
        }).when(response).setHeader(eq(REQUEST_HEADER), anyString());

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: Generated correlation ID is a valid UUID (not empty string)
        assertThat(generatedId.get()).isNotBlank();
        assertThat(UUID.fromString(generatedId.get())).isNotNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldGenerateUuidWhenHeaderBlank() throws ServletException, IOException {
        // Given: Blank X-Request-ID header (whitespace only)
        when(request.getHeader(REQUEST_HEADER)).thenReturn("   ");

        // Capture the correlation ID set in response header
        AtomicReference<String> generatedId = new AtomicReference<>();
        doAnswer(invocation -> {
            generatedId.set(invocation.getArgument(1));
            return null;
        }).when(response).setHeader(eq(REQUEST_HEADER), anyString());

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: Generated correlation ID is a valid UUID (not blank string)
        assertThat(generatedId.get()).isNotBlank();
        assertThat(UUID.fromString(generatedId.get())).isNotNull();
        verify(filterChain).doFilter(request, response);
    }

    // ========== MDC Cleanup Tests ==========

    @Test
    void shouldClearMdcAfterRequest() throws ServletException, IOException {
        // Given: Request with X-Request-ID header
        when(request.getHeader(REQUEST_HEADER)).thenReturn("cleanup-test-id");

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: MDC is cleared after request completes
        assertThat(MDC.get(MDC_KEY)).isNull();
    }

    @Test
    void shouldClearMdcEvenWhenFilterChainThrowsException() throws ServletException, IOException {
        // Given: Request with X-Request-ID header, filter chain throws exception
        when(request.getHeader(REQUEST_HEADER)).thenReturn("exception-test-id");
        doThrow(new ServletException("Simulated downstream error"))
                .when(filterChain).doFilter(request, response);

        // When/Then: Filter propagates exception but still clears MDC
        assertThatThrownBy(() ->
                correlationIdFilter.doFilterInternal(request, response, filterChain)
        ).isInstanceOf(ServletException.class)
                .hasMessage("Simulated downstream error");

        // MDC is still cleared
        assertThat(MDC.get(MDC_KEY)).isNull();
    }

    @Test
    void shouldClearMdcEvenWhenFilterChainThrowsRuntimeException() throws ServletException, IOException {
        // Given: Request with X-Request-ID header, filter chain throws RuntimeException
        when(request.getHeader(REQUEST_HEADER)).thenReturn("runtime-exception-test-id");
        doThrow(new RuntimeException("Simulated runtime error"))
                .when(filterChain).doFilter(request, response);

        // When/Then: Filter propagates exception but still clears MDC
        assertThatThrownBy(() ->
                correlationIdFilter.doFilterInternal(request, response, filterChain)
        ).isInstanceOf(RuntimeException.class)
                .hasMessage("Simulated runtime error");

        // MDC is still cleared
        assertThat(MDC.get(MDC_KEY)).isNull();
    }

    @Test
    void shouldClearMdcEvenWhenFilterChainThrowsIOException() throws ServletException, IOException {
        // Given: Request with X-Request-ID header, filter chain throws IOException
        when(request.getHeader(REQUEST_HEADER)).thenReturn("io-exception-test-id");
        doThrow(new IOException("Simulated IO error"))
                .when(filterChain).doFilter(request, response);

        // When/Then: Filter propagates exception but still clears MDC
        assertThatThrownBy(() ->
                correlationIdFilter.doFilterInternal(request, response, filterChain)
        ).isInstanceOf(IOException.class)
                .hasMessage("Simulated IO error");

        // MDC is still cleared
        assertThat(MDC.get(MDC_KEY)).isNull();
    }

    // ========== Filter Chain Execution Tests ==========

    @Test
    void shouldAlwaysCallFilterChainWithProvidedHeader() throws ServletException, IOException {
        // Given: Request with X-Request-ID header
        when(request.getHeader(REQUEST_HEADER)).thenReturn("chain-test-id");

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: Filter chain is called exactly once
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void shouldAlwaysCallFilterChainWithMissingHeader() throws ServletException, IOException {
        // Given: No X-Request-ID header
        when(request.getHeader(REQUEST_HEADER)).thenReturn(null);

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: Filter chain is called exactly once
        verify(filterChain, times(1)).doFilter(request, response);
    }

    // ========== Response Header Tests ==========

    @Test
    void shouldSetResponseHeaderBeforeFilterChain() throws ServletException, IOException {
        // Given: Request with X-Request-ID header
        String correlationId = "response-header-test";
        when(request.getHeader(REQUEST_HEADER)).thenReturn(correlationId);

        // Track order of operations
        AtomicReference<Boolean> headerSetBeforeChain = new AtomicReference<>(false);
        doAnswer(invocation -> {
            // At this point, verify response.setHeader was already called
            verify(response, atLeastOnce()).setHeader(REQUEST_HEADER, correlationId);
            headerSetBeforeChain.set(true);
            return null;
        }).when(filterChain).doFilter(request, response);

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: Response header was set before filter chain executed
        assertThat(headerSetBeforeChain.get()).isTrue();
    }

    // ========== Correlation ID Consistency Tests ==========

    @Test
    void shouldUseSameCorrelationIdForMdcAndResponseHeader() throws ServletException, IOException {
        // Given: No X-Request-ID header (UUID will be generated)
        when(request.getHeader(REQUEST_HEADER)).thenReturn(null);

        // Capture both MDC value and response header value
        AtomicReference<String> mdcValue = new AtomicReference<>();
        AtomicReference<String> responseHeaderValue = new AtomicReference<>();

        doAnswer(invocation -> {
            mdcValue.set(MDC.get(MDC_KEY));
            return null;
        }).when(filterChain).doFilter(request, response);

        doAnswer(invocation -> {
            responseHeaderValue.set(invocation.getArgument(1));
            return null;
        }).when(response).setHeader(eq(REQUEST_HEADER), anyString());

        // When: Filter processes request
        correlationIdFilter.doFilterInternal(request, response, filterChain);

        // Then: Same correlation ID used for both MDC and response header
        assertThat(mdcValue.get()).isEqualTo(responseHeaderValue.get());
    }
}
