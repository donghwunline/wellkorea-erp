package com.wellkorea.backend.shared.mail;

/**
 * Abstraction for sending emails.
 * Implementations handle the transport mechanism (SMTP, Microsoft Graph, etc.).
 */
public interface MailSender {

    /**
     * Sends an email message.
     *
     * @param message The message to send
     * @throws MailSendException if sending fails
     */
    void send(MailMessage message);

    /**
     * Checks if this mail sender is properly configured and available.
     *
     * @return true if the sender can be used
     */
    default boolean isAvailable() {
        return true;
    }

    /**
     * Returns the type of this mail sender for logging/diagnostics.
     *
     * @return A descriptive name (e.g., "SMTP", "Microsoft Graph")
     */
    String getType();
}
