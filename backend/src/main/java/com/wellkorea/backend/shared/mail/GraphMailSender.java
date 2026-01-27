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
 * </ul>
 *
 * <p>Refresh token can be provided via:
 * <ul>
 *     <li>In-app OAuth2 configuration (stored in database)</li>
 *     <li>Environment variable MICROSOFT_GRAPH_REFRESH_TOKEN (fallback)</li>
 * </ul>
 */
public class GraphMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(GraphMailSender.class);
    private static final String GRAPH_SEND_MAIL_URL = "https://graph.microsoft.com/v1.0/me/sendMail";
    private static final String TOKEN_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";

    private final String clientId;
    private final String clientSecret;
    private final RefreshTokenProvider refreshTokenProvider;
    private final HttpClient httpClient;

    private String accessToken;
    private long tokenExpiryTime;
    private String cachedRefreshToken;

    public GraphMailSender(String clientId, String clientSecret, RefreshTokenProvider refreshTokenProvider) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshTokenProvider = refreshTokenProvider;
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
                log.info("Graph: Sent email to {} (cc: {}) with subject: {}",
                        message.to(), message.cc().size(), message.subject());
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
        String currentRefreshToken = refreshTokenProvider.getRefreshToken()
                .orElseThrow(() -> new MailSendException("No refresh token available. Configure via admin settings or environment variable."));

        // If refresh token changed or no valid access token, refresh
        if (accessToken == null ||
                System.currentTimeMillis() >= tokenExpiryTime ||
                !currentRefreshToken.equals(cachedRefreshToken)) {
            refreshAccessToken(currentRefreshToken);
        }
    }

    private void refreshAccessToken(String refreshToken) {
        this.cachedRefreshToken = refreshToken;

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
        return clientId != null && !clientId.isBlank()
                && clientSecret != null && !clientSecret.isBlank()
                && refreshTokenProvider.hasToken();
    }

    @Override
    public String getType() {
        return "Microsoft Graph";
    }
}
