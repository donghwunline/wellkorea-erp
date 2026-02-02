package com.wellkorea.backend.core.purchasing.api.dto.command;

/**
 * Result DTO for attachment link/unlink operations.
 *
 * @param referenceId The attachment reference ID
 * @param message     Success message
 */
public record AttachmentCommandResult(String referenceId, String message) {

    public static AttachmentCommandResult linked(String referenceId) {
        return new AttachmentCommandResult(referenceId, "Attachment linked successfully");
    }

    public static AttachmentCommandResult unlinked(String referenceId) {
        return new AttachmentCommandResult(referenceId, "Attachment unlinked successfully");
    }
}
