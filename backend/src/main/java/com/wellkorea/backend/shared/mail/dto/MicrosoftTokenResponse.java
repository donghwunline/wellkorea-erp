package com.wellkorea.backend.shared.mail.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Microsoft OAuth2 token response.
 * Used when exchanging authorization code or refreshing tokens.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MicrosoftTokenResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("expires_in") int expiresIn,
        @JsonProperty("refresh_token") String refreshToken,
        @JsonProperty("token_type") String tokenType,
        @JsonProperty("scope") String scope
) {}
