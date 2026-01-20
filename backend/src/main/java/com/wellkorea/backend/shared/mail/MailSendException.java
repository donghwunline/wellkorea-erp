package com.wellkorea.backend.shared.mail;

/**
 * Exception thrown when email sending fails.
 */
public class MailSendException extends RuntimeException {

    public MailSendException(String message) {
        super(message);
    }

    public MailSendException(String message, Throwable cause) {
        super(message, cause);
    }
}
