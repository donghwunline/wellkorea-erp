package com.wellkorea.backend.admin.mail.application;

import com.wellkorea.backend.admin.mail.domain.MailOAuth2Config;
import com.wellkorea.backend.admin.mail.domain.MailOAuth2State;
import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2ConfigRepository;
import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2StateRepository;
import com.wellkorea.backend.shared.exception.ErrorCode;
import com.wellkorea.backend.shared.exception.OAuth2Exception;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MailOAuth2Service.
 * Tests OAuth2 flow logic without external HTTP calls.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MailOAuth2Service Unit Tests")
class MailOAuth2ServiceTest {

    @Mock
    private MailOAuth2ConfigRepository configRepository;

    @Mock
    private MailOAuth2StateRepository stateRepository;

    private MailOAuth2Service service;

    @BeforeEach
    void setUp() {
        service = new MailOAuth2Service(configRepository, stateRepository);
        // Set required properties via reflection
        ReflectionTestUtils.setField(service, "clientId", "test-client-id");
        ReflectionTestUtils.setField(service, "clientSecret", "test-client-secret");
        ReflectionTestUtils.setField(service, "baseUrl", "http://localhost:8080");
    }

    @Nested
    @DisplayName("getStatus")
    class GetStatusTests {

        @Test
        @DisplayName("should return disconnected when no config exists")
        void getStatus_NoConfig_ReturnsDisconnected() {
            // Given
            when(configRepository.findSingletonConfig()).thenReturn(Optional.empty());

            // When
            var status = service.getStatus();

            // Then
            assertThat(status.connected()).isFalse();
            assertThat(status.senderEmail()).isNull();
            assertThat(status.connectedAt()).isNull();
        }

        @Test
        @DisplayName("should return connected when config exists")
        void getStatus_ConfigExists_ReturnsConnected() {
            // Given
            MailOAuth2Config config = new MailOAuth2Config("refresh-token", "sender@example.com", 1L);
            when(configRepository.findSingletonConfig()).thenReturn(Optional.of(config));

            // When
            var status = service.getStatus();

            // Then
            assertThat(status.connected()).isTrue();
            assertThat(status.senderEmail()).isEqualTo("sender@example.com");
            assertThat(status.connectedById()).isEqualTo(1L);
        }
    }

    @Nested
    @DisplayName("generateAuthorizationUrl")
    class GenerateAuthorizationUrlTests {

        @Test
        @DisplayName("should create state and return authorization URL")
        void generateAuthorizationUrl_CreatesStateAndReturnsUrl() {
            // Given
            Long userId = 1L;

            // When
            String url = service.generateAuthorizationUrl(userId);

            // Then
            assertThat(url).contains("https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize");
            assertThat(url).contains("client_id=test-client-id");
            assertThat(url).contains("redirect_uri=");
            assertThat(url).contains("state=");

            verify(stateRepository).deleteExpiredStates(any(Instant.class));
            verify(stateRepository).save(any(MailOAuth2State.class));
        }

        @Test
        @DisplayName("should throw OAuth2Exception when Microsoft not configured")
        void generateAuthorizationUrl_MicrosoftNotConfigured_ThrowsException() {
            // Given
            ReflectionTestUtils.setField(service, "clientId", "");

            // When & Then
            assertThatThrownBy(() -> service.generateAuthorizationUrl(1L))
                    .isInstanceOf(OAuth2Exception.class)
                    .extracting(e -> ((OAuth2Exception) e).getErrorCode())
                    .isEqualTo(ErrorCode.OAUTH_CONFIG_MISSING);
        }
    }

    @Nested
    @DisplayName("handleCallback")
    class HandleCallbackTests {

        @Test
        @DisplayName("should throw OAuth2Exception with OAUTH_001 for invalid state")
        void handleCallback_InvalidState_ThrowsOAuth2Exception() {
            // Given
            when(stateRepository.findById("invalid-state")).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> service.handleCallback("code", "invalid-state"))
                    .isInstanceOf(OAuth2Exception.class)
                    .extracting(e -> ((OAuth2Exception) e).getErrorCode())
                    .isEqualTo(ErrorCode.OAUTH_INVALID_STATE);
        }

        @Test
        @DisplayName("should throw OAuth2Exception with OAUTH_002 for expired state")
        void handleCallback_ExpiredState_ThrowsOAuth2Exception() {
            // Given
            MailOAuth2State expiredState = mock(MailOAuth2State.class);
            when(expiredState.isExpired()).thenReturn(true);
            when(stateRepository.findById("expired-state")).thenReturn(Optional.of(expiredState));

            // When & Then
            assertThatThrownBy(() -> service.handleCallback("code", "expired-state"))
                    .isInstanceOf(OAuth2Exception.class)
                    .extracting(e -> ((OAuth2Exception) e).getErrorCode())
                    .isEqualTo(ErrorCode.OAUTH_STATE_EXPIRED);

            verify(stateRepository).delete(expiredState);
        }
    }

    @Nested
    @DisplayName("disconnect")
    class DisconnectTests {

        @Test
        @DisplayName("should delete all configs")
        void disconnect_RemovesAllConfigs() {
            // When
            service.disconnect();

            // Then
            verify(configRepository).deleteAll();
        }
    }

    @Nested
    @DisplayName("isMicrosoftConfigured")
    class IsMicrosoftConfiguredTests {

        @Test
        @DisplayName("should return true when client ID and secret are set")
        void isMicrosoftConfigured_WhenConfigured_ReturnsTrue() {
            // Given - already set in setUp()

            // When
            boolean configured = service.isMicrosoftConfigured();

            // Then
            assertThat(configured).isTrue();
        }

        @Test
        @DisplayName("should return false when client ID is blank")
        void isMicrosoftConfigured_BlankClientId_ReturnsFalse() {
            // Given
            ReflectionTestUtils.setField(service, "clientId", "");

            // When
            boolean configured = service.isMicrosoftConfigured();

            // Then
            assertThat(configured).isFalse();
        }

        @Test
        @DisplayName("should return false when client secret is blank")
        void isMicrosoftConfigured_BlankClientSecret_ReturnsFalse() {
            // Given
            ReflectionTestUtils.setField(service, "clientSecret", "");

            // When
            boolean configured = service.isMicrosoftConfigured();

            // Then
            assertThat(configured).isFalse();
        }
    }
}
