package com.wellkorea.backend.shared.mail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link MailMessage} record and its builder.
 */
@Tag("unit")
@DisplayName("MailMessage")
class MailMessageTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("creates valid message with all fields")
        void createsValidMessageWithAllFields() {
            MailAttachment attachment = MailAttachment.pdf("doc.pdf", new byte[]{1, 2, 3});

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .cc("cc1@example.com")
                    .cc("cc2@example.com")
                    .subject("Test Subject")
                    .htmlBody("<h1>Hello</h1>")
                    .attachment(attachment)
                    .build();

            assertThat(message.from()).isEqualTo("sender@example.com");
            assertThat(message.to()).isEqualTo("recipient@example.com");
            assertThat(message.cc()).containsExactly("cc1@example.com", "cc2@example.com");
            assertThat(message.subject()).isEqualTo("Test Subject");
            assertThat(message.body()).isEqualTo("<h1>Hello</h1>");
            assertThat(message.html()).isTrue();
            assertThat(message.attachments()).containsExactly(attachment);
        }

        @Test
        @DisplayName("creates plain text message")
        void createsPlainTextMessage() {
            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .plainTextBody("Hello, world!")
                    .build();

            assertThat(message.body()).isEqualTo("Hello, world!");
            assertThat(message.html()).isFalse();
        }

        @Test
        @DisplayName("creates message with body() method (defaults to plain text)")
        void createsMessageWithBodyMethod() {
            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .body("Simple body")
                    .build();

            assertThat(message.body()).isEqualTo("Simple body");
            assertThat(message.html()).isFalse();
        }

        @Test
        @DisplayName("accepts CC list via cc(List) method")
        void acceptsCcListViaCcListMethod() {
            List<String> ccList = Arrays.asList("cc1@example.com", "cc2@example.com", "cc3@example.com");

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .body("Body")
                    .cc(ccList)
                    .build();

            assertThat(message.cc()).containsExactly("cc1@example.com", "cc2@example.com", "cc3@example.com");
        }

        @Test
        @DisplayName("accepts attachments list via attachments(List) method")
        void acceptsAttachmentsListViaAttachmentsMethod() {
            MailAttachment att1 = MailAttachment.pdf("doc1.pdf", new byte[]{1});
            MailAttachment att2 = MailAttachment.pdf("doc2.pdf", new byte[]{2});

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .body("Body")
                    .attachments(Arrays.asList(att1, att2))
                    .build();

            assertThat(message.attachments()).containsExactly(att1, att2);
        }

        @Test
        @DisplayName("throws when from is null")
        void throwsWhenFromIsNull() {
            assertThatIllegalStateException()
                    .isThrownBy(() -> MailMessage.builder()
                            .to("recipient@example.com")
                            .subject("Test")
                            .body("Body")
                            .build())
                    .withMessage("From address is required");
        }

        @Test
        @DisplayName("throws when from is blank")
        void throwsWhenFromIsBlank() {
            assertThatIllegalStateException()
                    .isThrownBy(() -> MailMessage.builder()
                            .from("   ")
                            .to("recipient@example.com")
                            .subject("Test")
                            .body("Body")
                            .build())
                    .withMessage("From address is required");
        }

        @Test
        @DisplayName("throws when to is null")
        void throwsWhenToIsNull() {
            assertThatIllegalStateException()
                    .isThrownBy(() -> MailMessage.builder()
                            .from("sender@example.com")
                            .subject("Test")
                            .body("Body")
                            .build())
                    .withMessage("To address is required");
        }

        @Test
        @DisplayName("throws when to is blank")
        void throwsWhenToIsBlank() {
            assertThatIllegalStateException()
                    .isThrownBy(() -> MailMessage.builder()
                            .from("sender@example.com")
                            .to("")
                            .subject("Test")
                            .body("Body")
                            .build())
                    .withMessage("To address is required");
        }

        @Test
        @DisplayName("throws when subject is null")
        void throwsWhenSubjectIsNull() {
            assertThatIllegalStateException()
                    .isThrownBy(() -> MailMessage.builder()
                            .from("sender@example.com")
                            .to("recipient@example.com")
                            .body("Body")
                            .build())
                    .withMessage("Subject is required");
        }

        @Test
        @DisplayName("throws when body is null")
        void throwsWhenBodyIsNull() {
            assertThatIllegalStateException()
                    .isThrownBy(() -> MailMessage.builder()
                            .from("sender@example.com")
                            .to("recipient@example.com")
                            .subject("Test")
                            .build())
                    .withMessage("Body is required");
        }

        @Test
        @DisplayName("filters null CC recipients")
        void filtersNullCcRecipients() {
            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .body("Body")
                    .cc((String) null)
                    .cc("valid@example.com")
                    .build();

            assertThat(message.cc()).containsExactly("valid@example.com");
        }

        @Test
        @DisplayName("filters blank CC recipients")
        void filtersBlankCcRecipients() {
            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .body("Body")
                    .cc("")
                    .cc("   ")
                    .cc("valid@example.com")
                    .build();

            assertThat(message.cc()).containsExactly("valid@example.com");
        }

        @Test
        @DisplayName("filters blank CC recipients from list")
        void filtersBlankCcRecipientsFromList() {
            List<String> ccList = Arrays.asList("", null, "  ", "valid@example.com", "another@example.com");

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .body("Body")
                    .cc(ccList)
                    .build();

            assertThat(message.cc()).containsExactly("valid@example.com", "another@example.com");
        }

        @Test
        @DisplayName("handles null CC list gracefully")
        void handlesNullCcListGracefully() {
            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .body("Body")
                    .cc((List<String>) null)
                    .build();

            assertThat(message.cc()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Record immutability")
    class ImmutabilityTests {

        @Test
        @DisplayName("CC list is immutable")
        void ccListIsImmutable() {
            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .body("Body")
                    .cc("cc@example.com")
                    .build();

            assertThatThrownBy(() -> message.cc().add("another@example.com"))
                    .isInstanceOf(UnsupportedOperationException.class);
        }

        @Test
        @DisplayName("attachments list is immutable")
        void attachmentsListIsImmutable() {
            MailAttachment attachment = MailAttachment.pdf("doc.pdf", new byte[]{1});

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("Test")
                    .body("Body")
                    .attachment(attachment)
                    .build();

            assertThatThrownBy(() -> message.attachments().add(MailAttachment.pdf("another.pdf", new byte[]{2})))
                    .isInstanceOf(UnsupportedOperationException.class);
        }

        @Test
        @DisplayName("CC defaults to empty immutable list when null")
        void ccDefaultsToEmptyImmutableListWhenNull() {
            MailMessage message = new MailMessage(
                    "sender@example.com",
                    "recipient@example.com",
                    null,  // null CC
                    "Subject",
                    "Body",
                    false,
                    List.of()
            );

            assertThat(message.cc()).isEmpty();
            assertThatThrownBy(() -> message.cc().add("test@example.com"))
                    .isInstanceOf(UnsupportedOperationException.class);
        }

        @Test
        @DisplayName("attachments defaults to empty immutable list when null")
        void attachmentsDefaultsToEmptyImmutableListWhenNull() {
            MailMessage message = new MailMessage(
                    "sender@example.com",
                    "recipient@example.com",
                    List.of(),
                    "Subject",
                    "Body",
                    false,
                    null  // null attachments
            );

            assertThat(message.attachments()).isEmpty();
            assertThatThrownBy(() -> message.attachments().add(MailAttachment.pdf("doc.pdf", new byte[]{1})))
                    .isInstanceOf(UnsupportedOperationException.class);
        }
    }
}
