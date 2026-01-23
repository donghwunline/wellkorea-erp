package com.wellkorea.backend.purchasing.api.dto.command;

import com.wellkorea.backend.purchasing.domain.vo.VendorPaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for recording a vendor payment against an accounts payable.
 */
public record RecordVendorPaymentRequest(
        @NotNull(message = "Payment date is required")
        LocalDate paymentDate,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        BigDecimal amount,

        @NotNull(message = "Payment method is required")
        VendorPaymentMethod paymentMethod,

        String referenceNumber,

        String notes
) {
}
