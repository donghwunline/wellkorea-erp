package com.wellkorea.backend.shared.mail;

/**
 * Value object representing an email attachment.
 * Abstracts the attachment data so implementations can handle it appropriately
 * (e.g., SMTP uses MimeMessageHelper, Graph API uses base64 encoding).
 *
 * @param filename    The filename to use for the attachment
 * @param content     The attachment content as bytes
 * @param contentType The MIME content type (e.g., "application/pdf")
 */
public record MailAttachment(
        String filename,
        byte[] content,
        String contentType
) {
    /**
     * Creates a PDF attachment.
     *
     * @param filename The filename (should end with .pdf)
     * @param content  The PDF content as bytes
     * @return A new MailAttachment configured for PDF
     */
    public static MailAttachment pdf(String filename, byte[] content) {
        return new MailAttachment(filename, content, "application/pdf");
    }
}
