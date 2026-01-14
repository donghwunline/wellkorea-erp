package com.wellkorea.backend.shared.lock;

/**
 * Exception thrown when a distributed lock cannot be acquired.
 * <p>
 * This can occur when:
 * <ul>
 *   <li>Another operation holds the lock and timeout expires</li>
 *   <li>The thread is interrupted while waiting for the lock</li>
 * </ul>
 * <p>
 * Handled by {@link com.wellkorea.backend.shared.exception.GlobalExceptionHandler}
 * to return HTTP 409 Conflict with appropriate error message.
 *
 * @see ProjectLockService
 */
public class LockAcquisitionException extends RuntimeException {

    public LockAcquisitionException(String message) {
        super(message);
    }

    public LockAcquisitionException(String message, Throwable cause) {
        super(message, cause);
    }
}
