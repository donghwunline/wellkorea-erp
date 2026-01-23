package com.wellkorea.backend.finance.api.dto.command;

import java.math.BigDecimal;

/**
 * Result DTO for vendor payment command operations.
 */
public record VendorPaymentCommandResult(
        Long id,
        Long accountsPayableId,
        BigDecimal remainingBalance,
        String calculatedStatus,
        String message
) {
    public static VendorPaymentCommandResult recorded(
            Long id,
            Long accountsPayableId,
            BigDecimal remainingBalance,
            String calculatedStatus) {
        String message = remainingBalance.compareTo(BigDecimal.ZERO) <= 0
                ? "Payment recorded successfully. AP is now fully paid."
                : "Payment recorded successfully. Remaining balance: " + remainingBalance;
        return new VendorPaymentCommandResult(id, accountsPayableId, remainingBalance, calculatedStatus, message);
    }
}
