package com.wellkorea.backend.shared.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Microsoft Graph API implementation of MailSender using Client Credentials flow.
 * Suitable for Microsoft 365 organization accounts (server-to-server communication).
 *
 * <p>Required configuration properties:
 * <ul>
 *     <li>microsoft.graph.tenant-id - Azure AD tenant ID</li>
 *     <li>microsoft.graph.client-id - Azure AD app client ID</li>
 *     <li>microsoft.graph.client-secret - Azure AD app client secret</li>
 *     <li>microsoft.graph.sender-email - Sender email address (must be valid mailbox in tenant)</li>
 * </ul>
 *
 * <p>Azure AD Setup Requirements:
 * <ol>
 *     <li>Register app in Azure Portal → App registrations</li>
 *     <li>Add API permission: Microsoft Graph → Application → Mail.Send</li>
 *     <li>Grant admin consent for the permission</li>
 *     <li>Create client secret under Certificates & secrets</li>
 * </ol>
 */
public class GraphClientCredentialsMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(GraphClientCredentialsMailSender.class);
    private static final String GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";
    private static final String TOKEN_URL_TEMPLATE = "https://login.microsoftonline.com/%s/oauth2/v2.0/token";

    private final String tenantId;
    private final String clientId;
    private final String clientSecret;
    private final String senderEmail;
    private final HttpClient httpClient;

    private String accessToken;
    private long tokenExpiryTime;

    public GraphClientCredentialsMailSender(String tenantId, String clientId, String clientSecret, String senderEmail) {
        this.tenantId = tenantId;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.senderEmail = senderEmail;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public void send(MailMessage message) {
        ensureValidAccessToken();

        String sendMailUrl = String.format("%s/users/%s/sendMail", GRAPH_API_BASE,
                URLEncoder.encode(senderEmail, StandardCharsets.UTF_8));
        String jsonBody = buildGraphMailJson(message);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(sendMailUrl))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 202) {
                log.info("Graph (Client Credentials): Sent email from {} to {} (cc: {}) with subject: {}",
                        senderEmail, message.to(), message.cc().size(), message.subject());
            } else {
                String errorBody = response.body();
                log.error("Graph API sendMail failed: status={}, url={}, body={}",
                        response.statusCode(), sendMailUrl, errorBody);
                throw new MailSendException("Microsoft Graph API returned status " + response.statusCode()
                        + ": " + (errorBody != null && !errorBody.isBlank() ? errorBody : "(empty response body)"));
            }

        } catch (MailSendException e) {
            throw e;
        } catch (Exception e) {
            throw new MailSendException("Failed to send email via Microsoft Graph: " + e.getMessage(), e);
        }
    }

    private void ensureValidAccessToken() {
        if (accessToken == null || System.currentTimeMillis() >= tokenExpiryTime) {
            obtainAccessToken();
        }
    }

    private void obtainAccessToken() {
        String tokenUrl = String.format(TOKEN_URL_TEMPLATE, tenantId);
        String requestBody = String.format(
                "client_id=%s&client_secret=%s&scope=%s&grant_type=client_credentials",
                URLEncoder.encode(clientId, StandardCharsets.UTF_8),
                URLEncoder.encode(clientSecret, StandardCharsets.UTF_8),
                URLEncoder.encode("https://graph.microsoft.com/.default", StandardCharsets.UTF_8)
        );

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(tokenUrl))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                accessToken = extractJsonValue(body, "access_token");
                int expiresIn = Integer.parseInt(extractJsonValue(body, "expires_in"));
                tokenExpiryTime = System.currentTimeMillis() + (expiresIn - 60) * 1000L; // Refresh 60s before expiry
                log.debug("Graph (Client Credentials): Access token obtained, expires in {} seconds", expiresIn);
            } else {
                throw new MailSendException("Failed to obtain access token: " + response.body());
            }

        } catch (MailSendException e) {
            throw e;
        } catch (Exception e) {
            throw new MailSendException("Failed to obtain access token: " + e.getMessage(), e);
        }
    }

    private String buildGraphMailJson(MailMessage message) {
        StringBuilder json = new StringBuilder();
        json.append("{\"message\":{");
        json.append("\"subject\":\"").append(escapeJson(message.subject())).append("\",");
        json.append("\"body\":{");
        json.append("\"contentType\":\"").append(message.html() ? "HTML" : "Text").append("\",");
        json.append("\"content\":\"").append(escapeJson(message.body())).append("\"");
        json.append("},");
        json.append("\"toRecipients\":[{\"emailAddress\":{\"address\":\"")
                .append(escapeJson(message.to())).append("\"}}]");

        // Add CC recipients if present
        if (!message.cc().isEmpty()) {
            json.append(",\"ccRecipients\":[");
            boolean first = true;
            for (String ccRecipient : message.cc()) {
                if (!first) json.append(",");
                json.append("{\"emailAddress\":{\"address\":\"")
                        .append(escapeJson(ccRecipient)).append("\"}}");
                first = false;
            }
            json.append("]");
        }

        if (!message.attachments().isEmpty()) {
            json.append(",\"attachments\":[");
            boolean first = true;
            for (MailAttachment attachment : message.attachments()) {
                if (!first) json.append(",");
                json.append("{");
                json.append("\"@odata.type\":\"#microsoft.graph.fileAttachment\",");
                json.append("\"name\":\"").append(escapeJson(attachment.filename())).append("\",");
                json.append("\"contentType\":\"").append(escapeJson(attachment.contentType())).append("\",");
                json.append("\"contentBytes\":\"").append(Base64.getEncoder().encodeToString(attachment.content())).append("\"");
                json.append("}");
                first = false;
            }
            json.append("]");
        }

        json.append("},\"saveToSentItems\":true}");
        return json.toString();
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\":";
        int start = json.indexOf(searchKey);
        if (start == -1) return "";
        start += searchKey.length();
        if (json.charAt(start) == '"') {
            start++;
            int end = json.indexOf("\"", start);
            return json.substring(start, end);
        } else {
            int end = json.indexOf(",", start);
            if (end == -1) end = json.indexOf("}", start);
            return json.substring(start, end).trim();
        }
    }

    @Override
    public boolean isAvailable() {
        return tenantId != null && !tenantId.isBlank()
                && clientId != null && !clientId.isBlank()
                && clientSecret != null && !clientSecret.isBlank()
                && senderEmail != null && !senderEmail.isBlank();
    }

    @Override
    public String getType() {
        return "Microsoft Graph (Client Credentials)";
    }
}
