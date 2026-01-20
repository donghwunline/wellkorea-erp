package com.wellkorea.backend.shared.mail;

import java.util.ArrayList;
import java.util.List;

/**
 * Value object representing an email message.
 * Immutable and implementation-agnostic.
 */
public record MailMessage(
        String from,
        String to,
        List<String> cc,
        String subject,
        String body,
        boolean html,
        List<MailAttachment> attachments
) {
    public MailMessage {
        cc = cc != null ? List.copyOf(cc) : List.of();
        attachments = attachments != null ? List.copyOf(attachments) : List.of();
    }

    /**
     * Builder for creating MailMessage instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String from;
        private String to;
        private final List<String> cc = new ArrayList<>();
        private String subject;
        private String body;
        private boolean html = false;
        private final List<MailAttachment> attachments = new ArrayList<>();

        public Builder from(String from) {
            this.from = from;
            return this;
        }

        public Builder to(String to) {
            this.to = to;
            return this;
        }

        public Builder cc(String ccRecipient) {
            if (ccRecipient != null && !ccRecipient.isBlank()) {
                this.cc.add(ccRecipient);
            }
            return this;
        }

        public Builder cc(List<String> ccRecipients) {
            if (ccRecipients != null) {
                ccRecipients.stream()
                        .filter(r -> r != null && !r.isBlank())
                        .forEach(this.cc::add);
            }
            return this;
        }

        public Builder subject(String subject) {
            this.subject = subject;
            return this;
        }

        public Builder body(String body) {
            this.body = body;
            return this;
        }

        public Builder htmlBody(String htmlBody) {
            this.body = htmlBody;
            this.html = true;
            return this;
        }

        public Builder plainTextBody(String plainTextBody) {
            this.body = plainTextBody;
            this.html = false;
            return this;
        }

        public Builder attachment(MailAttachment attachment) {
            this.attachments.add(attachment);
            return this;
        }

        public Builder attachments(List<MailAttachment> attachments) {
            this.attachments.addAll(attachments);
            return this;
        }

        public MailMessage build() {
            if (from == null || from.isBlank()) {
                throw new IllegalStateException("From address is required");
            }
            if (to == null || to.isBlank()) {
                throw new IllegalStateException("To address is required");
            }
            if (subject == null) {
                throw new IllegalStateException("Subject is required");
            }
            if (body == null) {
                throw new IllegalStateException("Body is required");
            }
            return new MailMessage(from, to, cc, subject, body, html, attachments);
        }
    }
}
