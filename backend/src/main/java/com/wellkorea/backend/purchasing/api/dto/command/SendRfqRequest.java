package com.wellkorea.backend.purchasing.api.dto.command;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Request DTO for sending RFQ to vendors.
 */
public record SendRfqRequest(
        @NotEmpty(message = "At least one vendor must be selected")
        List<Long> vendorIds
) {
}
