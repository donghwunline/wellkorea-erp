package com.wellkorea.backend.shared.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Mock implementation of MailSender for testing.
 * Stores sent messages in memory for verification.
 */
public class MockMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(MockMailSender.class);

    private final List<MailMessage> sentMessages = new ArrayList<>();
    private boolean shouldFail = false;
    private String failureMessage = "Simulated mail send failure";

    @Override
    public void send(MailMessage message) {
        if (shouldFail) {
            throw new MailSendException(failureMessage);
        }
        sentMessages.add(message);
        log.info("Mock: Recorded email to {} (cc: {}) with subject: {} ({} attachments)",
                message.to(), message.cc().size(), message.subject(), message.attachments().size());
    }

    @Override
    public String getType() {
        return "Mock";
    }

    /**
     * Returns all messages sent through this mock.
     *
     * @return Unmodifiable list of sent messages
     */
    public List<MailMessage> getSentMessages() {
        return Collections.unmodifiableList(sentMessages);
    }

    /**
     * Returns the last message sent, or null if none.
     *
     * @return The last sent message
     */
    public MailMessage getLastMessage() {
        return sentMessages.isEmpty() ? null : sentMessages.get(sentMessages.size() - 1);
    }

    /**
     * Clears all recorded messages.
     */
    public void clear() {
        sentMessages.clear();
    }

    /**
     * Configures the mock to throw an exception on the next send.
     *
     * @param message The error message for the exception
     */
    public void failOnNextSend(String message) {
        this.shouldFail = true;
        this.failureMessage = message;
    }

    /**
     * Resets failure configuration.
     */
    public void resetFailure() {
        this.shouldFail = false;
        this.failureMessage = "Simulated mail send failure";
    }

    /**
     * Verifies that at least one message was sent.
     *
     * @return true if messages were sent
     */
    public boolean hasSentMessages() {
        return !sentMessages.isEmpty();
    }

    /**
     * Returns the count of sent messages.
     *
     * @return Number of messages sent
     */
    public int getSentCount() {
        return sentMessages.size();
    }
}
