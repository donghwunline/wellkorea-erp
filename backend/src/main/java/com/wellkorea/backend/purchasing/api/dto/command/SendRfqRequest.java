package com.wellkorea.backend.purchasing.api.dto.command;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.Map;

/**
 * Request DTO for sending RFQ to vendors.
 */
public record SendRfqRequest(
        @NotEmpty(message = "At least one vendor must be selected")
        List<Long> vendorIds,

        /**
         * Optional email overrides per vendor.
         * Key: vendorId, Value: VendorEmailInfo with TO/CC email addresses.
         * If not provided for a vendor, the vendor's default email will be used.
         */
        Map<Long, VendorEmailInfo> vendorEmails
) {
    /**
     * Email info for a vendor.
     */
    public record VendorEmailInfo(
            @Email(message = "Invalid email format")
            String to,           // Optional - vendor email override

            List<@Email(message = "Invalid CC email format") String> ccEmails // Optional - CC recipients
    ) {
    }
}
