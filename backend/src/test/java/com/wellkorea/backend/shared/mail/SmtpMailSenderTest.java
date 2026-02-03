package com.wellkorea.backend.shared.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SmtpMailSender}.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("SmtpMailSender")
class SmtpMailSenderTest {

    @Mock
    private JavaMailSender javaMailSender;

    @Mock
    private MimeMessage mimeMessage;

    private SmtpMailSender smtpMailSender;

    @BeforeEach
    void setUp() {
        smtpMailSender = new SmtpMailSender(javaMailSender);
    }

    @Nested
    @DisplayName("send()")
    class SendTests {

        @Test
        @DisplayName("sends simple message (plain text, no attachments) using SimpleMailMessage")
        void sendsSimpleMessageUsingSimpleMailMessage() {
            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test Subject")
                    .plainTextBody("Hello, World!")
                    .build();

            smtpMailSender.send(message);

            ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            verify(javaMailSender).send(captor.capture());

            SimpleMailMessage sentMessage = captor.getValue();
            assertThat(sentMessage.getFrom()).isEqualTo("sender@example.com");
            assertThat(sentMessage.getTo()).containsExactly("recipient@example.com");
            assertThat(sentMessage.getSubject()).isEqualTo("Test Subject");
            assertThat(sentMessage.getText()).isEqualTo("Hello, World!");
        }

        @Test
        @DisplayName("sends HTML message using MimeMessage")
        void sendsHtmlMessageUsingMimeMessage() {
            when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("HTML Test")
                    .htmlBody("<h1>Hello</h1><p>World!</p>")
                    .build();

            smtpMailSender.send(message);

            verify(javaMailSender).createMimeMessage();
            verify(javaMailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("sends message with attachments using MimeMessage")
        void sendsMessageWithAttachmentsUsingMimeMessage() {
            when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

            MailAttachment attachment = MailAttachment.pdf("document.pdf", new byte[]{1, 2, 3});
            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("With Attachment")
                    .plainTextBody("See attached.")
                    .attachment(attachment)
                    .build();

            smtpMailSender.send(message);

            verify(javaMailSender).createMimeMessage();
            verify(javaMailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("sends message with multiple attachments")
        void sendsMessageWithMultipleAttachments() {
            when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

            MailAttachment att1 = MailAttachment.pdf("doc1.pdf", new byte[]{1});
            MailAttachment att2 = new MailAttachment("image.png", new byte[]{2}, "image/png");
            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Multiple Attachments")
                    .plainTextBody("See attached files.")
                    .attachment(att1)
                    .attachment(att2)
                    .build();

            smtpMailSender.send(message);

            verify(javaMailSender).createMimeMessage();
            verify(javaMailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("sends message with CC recipients")
        void sendsMessageWithCcRecipients() {
            when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .cc("cc1@example.com")
                    .cc("cc2@example.com")
                    .subject("With CC")
                    .htmlBody("<p>Hello</p>")
                    .build();

            smtpMailSender.send(message);

            verify(javaMailSender).createMimeMessage();
            verify(javaMailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("sends HTML message with CC and attachments")
        void sendsHtmlMessageWithCcAndAttachments() {
            when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

            MailAttachment attachment = MailAttachment.pdf("report.pdf", new byte[]{1, 2, 3, 4, 5});
            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .cc(List.of("cc1@example.com", "cc2@example.com", "cc3@example.com"))
                    .subject("Full Featured Email")
                    .htmlBody("<html><body><h1>Report</h1></body></html>")
                    .attachment(attachment)
                    .build();

            smtpMailSender.send(message);

            verify(javaMailSender).createMimeMessage();
            verify(javaMailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("wraps JavaMailSender MailException in MailSendException")
        void wrapsMailExceptionInMailSendException() {
            MailException mailException = new MailException("SMTP connection failed") {};

            doThrow(mailException).when(javaMailSender).send(any(SimpleMailMessage.class));

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .plainTextBody("Body")
                    .build();

            assertThatThrownBy(() -> smtpMailSender.send(message))
                    .isInstanceOf(MailException.class)
                    .hasMessageContaining("SMTP connection failed");
        }

        @Test
        @DisplayName("wraps MessagingException in MailSendException for MIME messages")
        void wrapsMessagingExceptionInMailSendException() throws MessagingException {
            // Create a MimeMessage mock that will cause MimeMessageHelper to throw
            MimeMessage problematicMimeMessage = mock(MimeMessage.class);
            when(javaMailSender.createMimeMessage()).thenReturn(problematicMimeMessage);

            // MimeMessageHelper will throw when trying to set content on a broken MimeMessage
            doThrow(new MessagingException("Invalid message format"))
                    .when(problematicMimeMessage).setContent(any(), any());

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .htmlBody("<p>Body</p>")
                    .build();

            assertThatThrownBy(() -> smtpMailSender.send(message))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Failed to send email via SMTP");
        }
    }

    @Nested
    @DisplayName("getType()")
    class GetTypeTests {

        @Test
        @DisplayName("returns 'SMTP'")
        void returnsSmtp() {
            assertThat(smtpMailSender.getType()).isEqualTo("SMTP");
        }
    }
}
