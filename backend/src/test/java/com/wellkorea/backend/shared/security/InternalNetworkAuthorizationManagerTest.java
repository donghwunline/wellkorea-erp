package com.wellkorea.backend.shared.security;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for InternalNetworkAuthorizationManager.
 * Tests IP extraction from headers and internal IP classification.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
class InternalNetworkAuthorizationManagerTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private Supplier<Authentication> authenticationSupplier;

    @Mock
    private RequestAuthorizationContext context;

    private InternalNetworkAuthorizationManager authorizationManager;

    @BeforeEach
    void setUp() {
        authorizationManager = new InternalNetworkAuthorizationManager();
    }

    // ========== IP Extraction Tests ==========

    @Nested
    class IpExtractionTests {

        @Test
        void shouldExtractIpFromXForwardedFor() {
            // Given: X-Forwarded-For header present
            when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.100");

            // When
            String ip = authorizationManager.extractClientIp(request);

            // Then
            assertThat(ip).isEqualTo("192.168.1.100");
        }

        @Test
        void shouldExtractFirstIpFromXForwardedForWithMultipleIps() {
            // Given: X-Forwarded-For with multiple IPs (client, proxy1, proxy2)
            when(request.getHeader("X-Forwarded-For")).thenReturn("10.0.0.1, 172.16.0.1, 192.168.1.1");

            // When
            String ip = authorizationManager.extractClientIp(request);

            // Then: First IP (original client) is extracted
            assertThat(ip).isEqualTo("10.0.0.1");
        }

        @Test
        void shouldTrimWhitespaceFromXForwardedFor() {
            // Given: X-Forwarded-For with whitespace
            when(request.getHeader("X-Forwarded-For")).thenReturn("  192.168.1.50  , 10.0.0.1");

            // When
            String ip = authorizationManager.extractClientIp(request);

            // Then
            assertThat(ip).isEqualTo("192.168.1.50");
        }

        @Test
        void shouldExtractIpFromXRealIpWhenXForwardedForMissing() {
            // Given: Only X-Real-IP header present
            when(request.getHeader("X-Forwarded-For")).thenReturn(null);
            when(request.getHeader("X-Real-IP")).thenReturn("10.0.0.50");

            // When
            String ip = authorizationManager.extractClientIp(request);

            // Then
            assertThat(ip).isEqualTo("10.0.0.50");
        }

        @Test
        void shouldExtractIpFromXRealIpWhenXForwardedForBlank() {
            // Given: X-Forwarded-For is blank
            when(request.getHeader("X-Forwarded-For")).thenReturn("   ");
            when(request.getHeader("X-Real-IP")).thenReturn("172.16.0.100");

            // When
            String ip = authorizationManager.extractClientIp(request);

            // Then
            assertThat(ip).isEqualTo("172.16.0.100");
        }

        @Test
        void shouldTrimWhitespaceFromXRealIp() {
            // Given: X-Real-IP with whitespace
            when(request.getHeader("X-Forwarded-For")).thenReturn(null);
            when(request.getHeader("X-Real-IP")).thenReturn("  192.168.0.1  ");

            // When
            String ip = authorizationManager.extractClientIp(request);

            // Then
            assertThat(ip).isEqualTo("192.168.0.1");
        }

        @Test
        void shouldFallbackToRemoteAddrWhenNoHeaders() {
            // Given: No proxy headers present
            when(request.getHeader("X-Forwarded-For")).thenReturn(null);
            when(request.getHeader("X-Real-IP")).thenReturn(null);
            when(request.getRemoteAddr()).thenReturn("127.0.0.1");

            // When
            String ip = authorizationManager.extractClientIp(request);

            // Then
            assertThat(ip).isEqualTo("127.0.0.1");
        }

        @Test
        void shouldPreferXForwardedForOverXRealIp() {
            // Given: Both headers present (X-Real-IP not stubbed since X-Forwarded-For takes precedence)
            when(request.getHeader("X-Forwarded-For")).thenReturn("10.0.0.1");

            // When
            String ip = authorizationManager.extractClientIp(request);

            // Then: X-Forwarded-For takes precedence
            assertThat(ip).isEqualTo("10.0.0.1");
        }
    }

    // ========== Localhost Tests ==========

    @Nested
    class LocalhostTests {

        @Test
        void shouldAllowIpv4Localhost() {
            assertThat(authorizationManager.isInternalIp("127.0.0.1")).isTrue();
        }

        @Test
        void shouldAllowIpv6LocalhostShortForm() {
            assertThat(authorizationManager.isInternalIp("::1")).isTrue();
        }

        @Test
        void shouldAllowIpv6LocalhostLongForm() {
            assertThat(authorizationManager.isInternalIp("0:0:0:0:0:0:0:1")).isTrue();
        }

        @Test
        void shouldDenyOtherLoopbackAddresses() {
            // Only 127.0.0.1 is allowed, not the entire 127.x.x.x range
            assertThat(authorizationManager.isInternalIp("127.0.0.2")).isFalse();
            assertThat(authorizationManager.isInternalIp("127.1.1.1")).isFalse();
        }
    }

    // ========== Private IP Range Tests ==========

    @Nested
    class PrivateIpRangeTests {

        @ParameterizedTest
        @ValueSource(strings = {
                "10.0.0.1",
                "10.0.0.255",
                "10.255.255.255",
                "10.10.10.10",
                "10.1.2.3"
        })
        void shouldAllow10xRange(String ip) {
            assertThat(authorizationManager.isInternalIp(ip)).isTrue();
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "172.16.0.1",
                "172.16.255.255",
                "172.17.0.1",      // Docker default bridge
                "172.20.0.1",
                "172.31.255.255",
                "172.25.10.100"
        })
        void shouldAllow172_16_31xRange(String ip) {
            assertThat(authorizationManager.isInternalIp(ip)).isTrue();
        }

        @Test
        void shouldDeny172OutsidePrivateRange() {
            // 172.15.x.x and 172.32.x.x are not private
            assertThat(authorizationManager.isInternalIp("172.15.0.1")).isFalse();
            assertThat(authorizationManager.isInternalIp("172.32.0.1")).isFalse();
            assertThat(authorizationManager.isInternalIp("172.0.0.1")).isFalse();
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "192.168.0.1",
                "192.168.1.1",
                "192.168.255.255",
                "192.168.100.50"
        })
        void shouldAllow192_168xRange(String ip) {
            assertThat(authorizationManager.isInternalIp(ip)).isTrue();
        }
    }

    // ========== External IP Tests (Should be Denied) ==========

    @Nested
    class ExternalIpTests {

        @ParameterizedTest
        @ValueSource(strings = {
                "8.8.8.8",           // Google DNS
                "1.1.1.1",           // Cloudflare DNS
                "203.0.113.1",       // TEST-NET-3
                "198.51.100.1",      // TEST-NET-2
                "93.184.216.34",     // example.com
                "13.107.42.14",      // Microsoft
                "151.101.1.140"      // Reddit
        })
        void shouldDenyPublicIps(String ip) {
            assertThat(authorizationManager.isInternalIp(ip)).isFalse();
        }

        @Test
        void shouldDenyNullIp() {
            assertThat(authorizationManager.isInternalIp(null)).isFalse();
        }

        @Test
        void shouldDenyEmptyIp() {
            assertThat(authorizationManager.isInternalIp("")).isFalse();
        }

        @Test
        void shouldDenyBlankIp() {
            assertThat(authorizationManager.isInternalIp("   ")).isFalse();
        }

        @Test
        void shouldDenyInvalidIpFormat() {
            assertThat(authorizationManager.isInternalIp("not-an-ip")).isFalse();
            assertThat(authorizationManager.isInternalIp("192.168.1")).isFalse();
            assertThat(authorizationManager.isInternalIp("192.168.1.1.1")).isFalse();
        }
    }

    // ========== Authorization Decision Tests ==========

    @Nested
    class AuthorizationDecisionTests {

        @Test
        void shouldGrantAccessFromLocalhost() {
            // Given
            when(context.getRequest()).thenReturn(request);
            when(request.getHeader("X-Forwarded-For")).thenReturn(null);
            when(request.getHeader("X-Real-IP")).thenReturn(null);
            when(request.getRemoteAddr()).thenReturn("127.0.0.1");
            when(request.getRequestURI()).thenReturn("/actuator/prometheus");

            // When
            AuthorizationDecision decision = authorizationManager.check(authenticationSupplier, context);

            // Then
            assertThat(decision.isGranted()).isTrue();
        }

        @Test
        void shouldGrantAccessFromDockerNetwork() {
            // Given: Request from Docker default bridge network
            when(context.getRequest()).thenReturn(request);
            when(request.getHeader("X-Forwarded-For")).thenReturn(null);
            when(request.getHeader("X-Real-IP")).thenReturn(null);
            when(request.getRemoteAddr()).thenReturn("172.17.0.2");
            when(request.getRequestURI()).thenReturn("/actuator/prometheus");

            // When
            AuthorizationDecision decision = authorizationManager.check(authenticationSupplier, context);

            // Then
            assertThat(decision.isGranted()).isTrue();
        }

        @Test
        void shouldDenyAccessFromExternalIp() {
            // Given: Request from external IP
            when(context.getRequest()).thenReturn(request);
            when(request.getHeader("X-Forwarded-For")).thenReturn(null);
            when(request.getHeader("X-Real-IP")).thenReturn(null);
            when(request.getRemoteAddr()).thenReturn("8.8.8.8");
            when(request.getRequestURI()).thenReturn("/actuator/prometheus");

            // When
            AuthorizationDecision decision = authorizationManager.check(authenticationSupplier, context);

            // Then
            assertThat(decision.isGranted()).isFalse();
        }

        @Test
        void shouldDenyAccessWhenProxiedFromExternalIp() {
            // Given: Request proxied from external IP (X-Forwarded-For set)
            when(context.getRequest()).thenReturn(request);
            when(request.getHeader("X-Forwarded-For")).thenReturn("93.184.216.34");
            when(request.getRequestURI()).thenReturn("/actuator/prometheus");

            // When
            AuthorizationDecision decision = authorizationManager.check(authenticationSupplier, context);

            // Then
            assertThat(decision.isGranted()).isFalse();
        }

        @Test
        void shouldGrantAccessWhenProxiedFromInternalIp() {
            // Given: Request proxied from internal IP
            when(context.getRequest()).thenReturn(request);
            when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.100");
            when(request.getRequestURI()).thenReturn("/actuator/prometheus");

            // When
            AuthorizationDecision decision = authorizationManager.check(authenticationSupplier, context);

            // Then
            assertThat(decision.isGranted()).isTrue();
        }
    }

    // ========== Edge Cases ==========

    @Nested
    class EdgeCases {

        @Test
        void shouldHandleIpWithLeadingTrailingWhitespace() {
            // When checking IP with whitespace (after trim in extractClientIp)
            assertThat(authorizationManager.isInternalIp(" 192.168.1.1 ")).isTrue();
        }

        @Test
        void shouldHandleEmptyXForwardedForWithValidRemoteAddr() {
            // Given
            when(request.getHeader("X-Forwarded-For")).thenReturn(",");
            when(request.getHeader("X-Real-IP")).thenReturn(null);
            when(request.getRemoteAddr()).thenReturn("10.0.0.1");

            // When
            String ip = authorizationManager.extractClientIp(request);

            // Then: Falls back to remoteAddr since first X-Forwarded-For is empty
            assertThat(ip).isEqualTo("10.0.0.1");
        }
    }
}
