package com.wellkorea.backend.finance.domain.exception;

import com.wellkorea.backend.finance.domain.vo.AccountsPayableStatus;

/**
 * Thrown when payment cannot be added to AccountsPayable (status-based restriction).
 * HTTP 409 Conflict.
 */
public class PaymentNotAllowedException extends RuntimeException {

    private final AccountsPayableStatus currentStatus;

    public PaymentNotAllowedException(AccountsPayableStatus currentStatus) {
        super(String.format("Cannot add payment to AccountsPayable in %s status", currentStatus));
        this.currentStatus = currentStatus;
    }

    public AccountsPayableStatus getCurrentStatus() {
        return currentStatus;
    }
}
