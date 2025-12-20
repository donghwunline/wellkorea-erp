package com.wellkorea.backend.approval.api.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * Request DTO for updating chain levels.
 */
public record UpdateChainLevelsRequest(
        @NotEmpty(message = "At least one level is required")
        @Valid
        List<ChainLevelRequest> levels
) {}
