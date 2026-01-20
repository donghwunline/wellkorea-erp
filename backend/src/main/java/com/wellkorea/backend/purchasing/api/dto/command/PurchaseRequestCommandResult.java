package com.wellkorea.backend.purchasing.api.dto.command;

/**
 * Command result DTO for purchase request operations.
 */
public record PurchaseRequestCommandResult(
        Long id,
        String message
) {
    public static PurchaseRequestCommandResult created(Long id) {
        return new PurchaseRequestCommandResult(id, "Purchase request created successfully");
    }

    public static PurchaseRequestCommandResult updated(Long id) {
        return new PurchaseRequestCommandResult(id, "Purchase request updated successfully");
    }

    public static PurchaseRequestCommandResult rfqSent(Long id, int vendorCount) {
        return new PurchaseRequestCommandResult(id, "RFQ sent to " + vendorCount + " vendors");
    }

    public static PurchaseRequestCommandResult rfqSent(Long id, int vendorCount, int emailsSent, int emailsFailed) {
        String message;
        if (emailsFailed == 0) {
            message = "RFQ sent to " + vendorCount + " vendors, " + emailsSent + " emails sent successfully";
        } else {
            message = "RFQ sent to " + vendorCount + " vendors, " + emailsSent + " emails sent, " + emailsFailed + " failed";
        }
        return new PurchaseRequestCommandResult(id, message);
    }

    public static PurchaseRequestCommandResult canceled(Long id) {
        return new PurchaseRequestCommandResult(id, "Purchase request canceled successfully");
    }

    // RFQ Item operations

    public static PurchaseRequestCommandResult rfqReplyRecorded(Long id) {
        return new PurchaseRequestCommandResult(id, "RFQ reply recorded successfully");
    }

    public static PurchaseRequestCommandResult rfqNoResponse(Long id) {
        return new PurchaseRequestCommandResult(id, "RFQ marked as no response");
    }

    public static PurchaseRequestCommandResult vendorSelected(Long id) {
        return new PurchaseRequestCommandResult(id, "Vendor selected successfully");
    }

    public static PurchaseRequestCommandResult rfqRejected(Long id) {
        return new PurchaseRequestCommandResult(id, "RFQ rejected successfully");
    }
}
