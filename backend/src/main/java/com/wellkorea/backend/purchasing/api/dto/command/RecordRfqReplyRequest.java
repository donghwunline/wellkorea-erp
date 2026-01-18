package com.wellkorea.backend.purchasing.api.dto.command;

import com.wellkorea.backend.purchasing.application.RfqCommandService.RecordRfqReplyCommand;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Request DTO for recording a vendor's RFQ reply.
 */
public record RecordRfqReplyRequest(
        @NotBlank(message = "Item ID is required")
        String itemId,

        @NotNull(message = "Quoted price is required")
        @DecimalMin(value = "0", message = "Quoted price must be non-negative")
        BigDecimal quotedPrice,

        @Min(value = 0, message = "Lead time must be non-negative")
        Integer quotedLeadTime,

        String notes
) {
    public RecordRfqReplyCommand toCommand() {
        return new RecordRfqReplyCommand(itemId, quotedPrice, quotedLeadTime, notes);
    }
}
