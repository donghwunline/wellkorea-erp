package com.wellkorea.backend.shared.security;

import com.wellkorea.backend.BaseIntegrationTest;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.actuate.observability.AutoConfigureObservability;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for Prometheus endpoint security.
 * Verifies that /actuator/prometheus is only accessible from internal IPs.
 * <p>
 * Note: MockMvc defaults to localhost (127.0.0.1) as the remote address,
 * so these tests verify that localhost access works. Testing external IP
 * denial requires setting X-Forwarded-For header to simulate proxied requests.
 */
@Tag("integration")
@AutoConfigureMockMvc
@AutoConfigureObservability  // Required to enable actuator metrics endpoints in tests
class PrometheusEndpointSecurityIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // ========== Localhost Access (Allowed) ==========

    @Test
    void shouldAllowPrometheusAccessFromLocalhost() throws Exception {
        // Given: Request from localhost (default in MockMvc)
        // When/Then: Access is granted
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isOk());
    }

    // ========== Internal IP Access via X-Forwarded-For (Allowed) ==========

    @Test
    void shouldAllowPrometheusAccessFromDockerNetwork() throws Exception {
        // Given: Request proxied from Docker network IP
        mockMvc.perform(get("/actuator/prometheus")
                        .header("X-Forwarded-For", "172.17.0.2"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowPrometheusAccessFrom10xNetwork() throws Exception {
        // Given: Request proxied from 10.x.x.x network
        mockMvc.perform(get("/actuator/prometheus")
                        .header("X-Forwarded-For", "10.0.0.50"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowPrometheusAccessFrom192_168Network() throws Exception {
        // Given: Request proxied from 192.168.x.x network
        mockMvc.perform(get("/actuator/prometheus")
                        .header("X-Forwarded-For", "192.168.1.100"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowPrometheusAccessViaXRealIpFromInternalNetwork() throws Exception {
        // Given: Request with X-Real-IP from internal network
        mockMvc.perform(get("/actuator/prometheus")
                        .header("X-Real-IP", "10.0.0.1"))
                .andExpect(status().isOk());
    }

    // ========== External IP Access (Denied) ==========
    // Note: Spring Security returns 401 (Unauthorized) for anonymous requests
    // that fail authorization, not 403 (Forbidden). This is secure behavior -
    // external IPs cannot access the endpoint regardless of the status code.

    @Test
    void shouldDenyPrometheusAccessFromExternalIpViaXForwardedFor() throws Exception {
        // Given: Request proxied from external IP
        // Expect 401 (Spring Security treats authorization failure for anonymous as 401)
        mockMvc.perform(get("/actuator/prometheus")
                        .header("X-Forwarded-For", "8.8.8.8"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldDenyPrometheusAccessFromExternalIpViaXRealIp() throws Exception {
        // Given: Request with X-Real-IP from external IP
        mockMvc.perform(get("/actuator/prometheus")
                        .header("X-Real-IP", "93.184.216.34"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldDenyPrometheusAccessFromPublicCloudIp() throws Exception {
        // Given: Request from public cloud IP (simulating external attacker)
        mockMvc.perform(get("/actuator/prometheus")
                        .header("X-Forwarded-For", "13.107.42.14"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldDenyPrometheusAccessFrom172OutsidePrivateRange() throws Exception {
        // Given: Request from 172.x.x.x outside private range (172.16-31)
        mockMvc.perform(get("/actuator/prometheus")
                        .header("X-Forwarded-For", "172.32.0.1"))
                .andExpect(status().isUnauthorized());
    }

    // ========== Other Actuator Endpoints (Unchanged) ==========

    @Test
    void shouldAllowHealthEndpointFromAnywhere() throws Exception {
        // Given: Request from external IP (health should still be public)
        mockMvc.perform(get("/actuator/health")
                        .header("X-Forwarded-For", "8.8.8.8"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowInfoEndpointFromAnywhere() throws Exception {
        // Given: Request from external IP (info should still be public)
        mockMvc.perform(get("/actuator/info")
                        .header("X-Forwarded-For", "8.8.8.8"))
                .andExpect(status().isOk());
    }
}
