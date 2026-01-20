package com.wellkorea.backend.shared.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;

/**
 * Microsoft Graph API implementation of MailSender.
 * Uses OAuth2 Delegated Permissions (Authorization Code flow with refresh tokens)
 * for personal Microsoft accounts (hotmail.com, outlook.com).
 *
 * <p>Required configuration properties:
 * <ul>
 *     <li>microsoft.graph.client-id - Azure AD app client ID</li>
 *     <li>microsoft.graph.client-secret - Azure AD app client secret</li>
 *     <li>microsoft.graph.refresh-token - User's refresh token (obtained via initial auth)</li>
 *     <li>microsoft.graph.user-email - The user's email (e.g., wellkorea@hotmail.com)</li>
 * </ul>
 *
 * <p>Note: Initial token acquisition requires manual OAuth2 authorization flow.
 * After that, the refresh token can be used to obtain new access tokens.
 */
public class GraphMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(GraphMailSender.class);
    private static final String GRAPH_SEND_MAIL_URL = "https://graph.microsoft.com/v1.0/me/sendMail";
    private static final String TOKEN_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";

    private final String clientId;
    private final String clientSecret;
    private final String refreshToken;
    private final HttpClient httpClient;

    private String accessToken;
    private long tokenExpiryTime;

    public GraphMailSender(String clientId, String clientSecret, String refreshToken) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public void send(MailMessage message) {
        ensureValidAccessToken();

        String jsonBody = buildGraphMailJson(message);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GRAPH_SEND_MAIL_URL))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 202) {
                log.info("Graph: Sent email to {} with subject: {}", message.to(), message.subject());
            } else {
                throw new MailSendException("Microsoft Graph API returned status " + response.statusCode()
                        + ": " + response.body());
            }

        } catch (MailSendException e) {
            throw e;
        } catch (Exception e) {
            throw new MailSendException("Failed to send email via Microsoft Graph: " + e.getMessage(), e);
        }
    }

    private void ensureValidAccessToken() {
        if (accessToken == null || System.currentTimeMillis() >= tokenExpiryTime) {
            refreshAccessToken();
        }
    }

    private void refreshAccessToken() {
        String requestBody = String.format(
                "client_id=%s&client_secret=%s&refresh_token=%s&grant_type=refresh_token&scope=Mail.Send",
                clientId, clientSecret, refreshToken
        );

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TOKEN_URL))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                // Simple JSON parsing (in production, use a proper JSON library)
                String body = response.body();
                accessToken = extractJsonValue(body, "access_token");
                int expiresIn = Integer.parseInt(extractJsonValue(body, "expires_in"));
                tokenExpiryTime = System.currentTimeMillis() + (expiresIn - 60) * 1000L; // Refresh 60s before expiry
                log.debug("Graph: Access token refreshed, expires in {} seconds", expiresIn);
            } else {
                throw new MailSendException("Failed to refresh access token: " + response.body());
            }

        } catch (MailSendException e) {
            throw e;
        } catch (Exception e) {
            throw new MailSendException("Failed to refresh access token: " + e.getMessage(), e);
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
        return clientId != null && !clientId.isBlank()
                && clientSecret != null && !clientSecret.isBlank()
                && refreshToken != null && !refreshToken.isBlank();
    }

    @Override
    public String getType() {
        return "Microsoft Graph";
    }
}
