package com.wellkorea.backend.shared.mail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link MailAttachment} record.
 */
@Tag("unit")
@DisplayName("MailAttachment")
class MailAttachmentTest {

    @Test
    @DisplayName("pdf() factory method creates attachment with correct content type")
    void pdfFactoryMethodCreatesAttachmentWithCorrectContentType() {
        byte[] content = {0x25, 0x50, 0x44, 0x46}; // %PDF magic bytes
        String filename = "quotation.pdf";

        MailAttachment attachment = MailAttachment.pdf(filename, content);

        assertThat(attachment.filename()).isEqualTo("quotation.pdf");
        assertThat(attachment.content()).isEqualTo(content);
        assertThat(attachment.contentType()).isEqualTo("application/pdf");
    }

    @Test
    @DisplayName("record holds filename, content, and contentType correctly")
    void recordHoldsAllFieldsCorrectly() {
        byte[] content = "Excel data".getBytes();
        String filename = "report.xlsx";
        String contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        MailAttachment attachment = new MailAttachment(filename, content, contentType);

        assertThat(attachment.filename()).isEqualTo("report.xlsx");
        assertThat(attachment.content()).isEqualTo(content);
        assertThat(attachment.contentType()).isEqualTo(contentType);
    }

    @Test
    @DisplayName("record supports various content types")
    void recordSupportsVariousContentTypes() {
        // Test various common attachment types
        MailAttachment pdfAttachment = new MailAttachment("doc.pdf", new byte[]{1}, "application/pdf");
        MailAttachment imageAttachment = new MailAttachment("image.png", new byte[]{2}, "image/png");
        MailAttachment textAttachment = new MailAttachment("readme.txt", new byte[]{3}, "text/plain");

        assertThat(pdfAttachment.contentType()).isEqualTo("application/pdf");
        assertThat(imageAttachment.contentType()).isEqualTo("image/png");
        assertThat(textAttachment.contentType()).isEqualTo("text/plain");
    }

    @Test
    @DisplayName("pdf() factory method handles empty content")
    void pdfFactoryMethodHandlesEmptyContent() {
        byte[] emptyContent = new byte[0];

        MailAttachment attachment = MailAttachment.pdf("empty.pdf", emptyContent);

        assertThat(attachment.content()).isEmpty();
        assertThat(attachment.contentType()).isEqualTo("application/pdf");
    }

    @Test
    @DisplayName("pdf() factory method handles large content")
    void pdfFactoryMethodHandlesLargeContent() {
        byte[] largeContent = new byte[1024 * 1024]; // 1MB
        for (int i = 0; i < largeContent.length; i++) {
            largeContent[i] = (byte) (i % 256);
        }

        MailAttachment attachment = MailAttachment.pdf("large.pdf", largeContent);

        assertThat(attachment.content()).hasSize(1024 * 1024);
        assertThat(attachment.contentType()).isEqualTo("application/pdf");
    }

    @Test
    @DisplayName("record equality uses array identity for content (Java record behavior)")
    void recordEqualityUsesArrayIdentityForContent() {
        byte[] content = {1, 2, 3};

        // Same byte array instance = equal
        MailAttachment att1 = new MailAttachment("file.pdf", content, "application/pdf");
        MailAttachment att2 = new MailAttachment("file.pdf", content, "application/pdf");
        assertThat(att1).isEqualTo(att2);

        // Different byte array instance (even with same content) = not equal
        // This is standard Java record behavior for arrays
        byte[] content2 = {1, 2, 3};
        MailAttachment att3 = new MailAttachment("file.pdf", content2, "application/pdf");
        assertThat(att1).isNotEqualTo(att3);

        // Different filename = not equal
        MailAttachment att4 = new MailAttachment("other.pdf", content, "application/pdf");
        assertThat(att1).isNotEqualTo(att4);
    }
}
