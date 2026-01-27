package com.wellkorea.backend.shared.mail.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Microsoft OAuth2 error response.
 * Returned when token requests fail.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MicrosoftErrorResponse(
        String error,
        @JsonProperty("error_description") String errorDescription,
        @JsonProperty("error_codes") int[] errorCodes,
        String timestamp,
        @JsonProperty("trace_id") String traceId,
        @JsonProperty("correlation_id") String correlationId
) {}
