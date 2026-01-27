package com.wellkorea.backend.shared.mail.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Microsoft Graph sendMail request structure.
 */
public record GraphMailRequest(
        GraphMessage message,
        boolean saveToSentItems
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record GraphMessage(
            String subject,
            GraphBody body,
            List<GraphRecipient> toRecipients,
            List<GraphRecipient> ccRecipients,
            List<GraphAttachment> attachments
    ) {}

    public record GraphBody(
            String contentType,
            String content
    ) {}

    public record GraphRecipient(
            GraphEmailAddress emailAddress
    ) {}

    public record GraphEmailAddress(
            String address
    ) {}

    public record GraphAttachment(
            @JsonProperty("@odata.type") String odataType,
            String name,
            String contentType,
            String contentBytes
    ) {
        public static GraphAttachment fileAttachment(String name, String contentType, String base64Content) {
            return new GraphAttachment("#microsoft.graph.fileAttachment", name, contentType, base64Content);
        }
    }
}
