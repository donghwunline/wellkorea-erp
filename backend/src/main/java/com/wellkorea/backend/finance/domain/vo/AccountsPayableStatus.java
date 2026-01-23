package com.wellkorea.backend.finance.domain.vo;

/**
 * Status of an accounts payable entry.
 */
public enum AccountsPayableStatus {
    /**
     * Payment obligation created, no payments made yet.
     */
    PENDING,

    /**
     * Some payments made, but balance remains.
     */
    PARTIALLY_PAID,

    /**
     * Full amount has been paid.
     */
    PAID,

    /**
     * AP entry voided/cancelled.
     */
    CANCELLED;

    /**
     * Check if a transition to the target status is valid.
     */
    public boolean canTransitionTo(AccountsPayableStatus target) {
        return switch (this) {
            case PENDING -> target == PARTIALLY_PAID || target == PAID || target == CANCELLED;
            case PARTIALLY_PAID -> target == PAID || target == CANCELLED;
            case PAID, CANCELLED -> false;
        };
    }

    /**
     * Check if payments can be received in this status.
     */
    public boolean canReceivePayment() {
        return this == PENDING || this == PARTIALLY_PAID;
    }
}
