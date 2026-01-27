package com.wellkorea.backend.shared.mail;

import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2ConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Configuration for mail sender beans.
 * Supports SMTP (default) and Microsoft Graph implementations.
 *
 * <p>Configuration properties:
 * <ul>
 *     <li>mail.provider=smtp (default) - Use SMTP via JavaMailSender</li>
 *     <li>mail.provider=graph - Use Microsoft Graph API</li>
 * </ul>
 */
@Configuration
public class MailSenderConfig {

    private static final Logger log = LoggerFactory.getLogger(MailSenderConfig.class);

    @Bean
    @Primary
    @ConditionalOnProperty(name = "mail.provider", havingValue = "smtp", matchIfMissing = true)
    public MailSender smtpMailSender(JavaMailSender javaMailSender) {
        log.info("Configuring SMTP mail sender");
        return new SmtpMailSender(javaMailSender);
    }

    @Bean
    @Primary
    @ConditionalOnProperty(name = "mail.provider", havingValue = "graph")
    public MailSender graphMailSender(
            @Value("${microsoft.graph.client-id}") String clientId,
            @Value("${microsoft.graph.client-secret}") String clientSecret,
            @Value("${microsoft.graph.refresh-token:}") String refreshToken,
            MailOAuth2ConfigRepository configRepository) {
        log.info("Configuring Microsoft Graph mail sender (Refresh Token)");
        RefreshTokenProvider tokenProvider = new DatabaseRefreshTokenProvider(configRepository, refreshToken);
        return new GraphMailSender(clientId, clientSecret, tokenProvider);
    }

    @Bean
    @Primary
    @ConditionalOnProperty(name = "mail.provider", havingValue = "graph-client-credentials")
    public MailSender graphClientCredentialsMailSender(
            @Value("${microsoft.graph.tenant-id}") String tenantId,
            @Value("${microsoft.graph.client-id}") String clientId,
            @Value("${microsoft.graph.client-secret}") String clientSecret,
            @Value("${microsoft.graph.sender-email}") String senderEmail) {
        log.info("Configuring Microsoft Graph mail sender (Client Credentials)");
        return new GraphClientCredentialsMailSender(tenantId, clientId, clientSecret, senderEmail);
    }
}
