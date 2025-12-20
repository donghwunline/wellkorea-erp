package com.wellkorea.backend.approval.api.dto.command;

/**
 * Result of an approval command operation.
 * Returns only the entity ID - clients should fetch fresh data via query endpoints.
 * This follows CQRS principle of keeping commands and queries separate.
 */
public record ApprovalCommandResult(
        Long id,
        String message
) {
    public static ApprovalCommandResult approved(Long id) {
        return new ApprovalCommandResult(id, "Approval request approved at current level");
    }

    public static ApprovalCommandResult rejected(Long id) {
        return new ApprovalCommandResult(id, "Approval request rejected");
    }

    public static ApprovalCommandResult created(Long id) {
        return new ApprovalCommandResult(id, "Approval request created");
    }

    public static ApprovalCommandResult chainUpdated(Long id) {
        return new ApprovalCommandResult(id, "Approval chain updated");
    }
}
