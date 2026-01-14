package com.wellkorea.backend.invoice.api.dto.command;

import java.math.BigDecimal;

/**
 * Result DTO for payment command operations.
 */
public record PaymentCommandResult(
        Long id,
        Long invoiceId,
        BigDecimal remainingBalance,
        String message
) {
    public static PaymentCommandResult recorded(Long id, Long invoiceId, BigDecimal remainingBalance) {
        String message = remainingBalance.compareTo(BigDecimal.ZERO) <= 0
                ? "Payment recorded successfully. Invoice is now fully paid."
                : "Payment recorded successfully. Remaining balance: " + remainingBalance;
        return new PaymentCommandResult(id, invoiceId, remainingBalance, message);
    }
}
