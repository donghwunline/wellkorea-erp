package com.wellkorea.backend.shared.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

/**
 * SMTP implementation of MailSender using Spring's JavaMailSender.
 */
public class SmtpMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpMailSender.class);

    private final JavaMailSender javaMailSender;

    public SmtpMailSender(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    @Override
    public void send(MailMessage message) {
        if (message.attachments().isEmpty() && !message.html()) {
            sendSimpleMessage(message);
        } else {
            sendMimeMessage(message);
        }
    }

    private void sendSimpleMessage(MailMessage message) {
        SimpleMailMessage simpleMessage = new SimpleMailMessage();
        simpleMessage.setFrom(message.from());
        simpleMessage.setTo(message.to());
        simpleMessage.setSubject(message.subject());
        simpleMessage.setText(message.body());

        javaMailSender.send(simpleMessage);
        log.info("SMTP: Sent simple email to {} with subject: {}", message.to(), message.subject());
    }

    private void sendMimeMessage(MailMessage message) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            boolean hasAttachments = !message.attachments().isEmpty();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, hasAttachments, "UTF-8");

            helper.setFrom(message.from());
            helper.setTo(message.to());
            helper.setSubject(message.subject());
            helper.setText(message.body(), message.html());

            // Set CC recipients if present
            if (!message.cc().isEmpty()) {
                helper.setCc(message.cc().toArray(new String[0]));
            }

            for (MailAttachment attachment : message.attachments()) {
                helper.addAttachment(
                        attachment.filename(),
                        new ByteArrayResource(attachment.content()),
                        attachment.contentType()
                );
            }

            javaMailSender.send(mimeMessage);
            log.info("SMTP: Sent MIME email to {} (cc: {}) with subject: {} ({} attachments)",
                    message.to(), message.cc().size(), message.subject(), message.attachments().size());

        } catch (MessagingException e) {
            throw new MailSendException("Failed to send email via SMTP: " + e.getMessage(), e);
        }
    }

    @Override
    public String getType() {
        return "SMTP";
    }
}
