package com.wellkorea.backend.shared.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;

/**
 * Configuration for application-level token encryption.
 * Uses Spring Security Crypto's AES-256 encryption for sensitive data like refresh tokens.
 *
 * <p>Required environment variables:
 * <ul>
 *     <li>APP_TOKEN_ENCRYPTION_KEY - 256-bit key (generate with: openssl rand -hex 32)</li>
 *     <li>APP_TOKEN_ENCRYPTION_SALT - 8-byte hex salt (generate with: openssl rand -hex 8)</li>
 * </ul>
 */
@Configuration
public class TokenEncryptionConfig {

    @Value("${app.token-encryption-key}")
    private String encryptionKey;

    @Value("${app.token-encryption-salt}")
    private String salt;

    /**
     * Creates a TextEncryptor bean for encrypting/decrypting sensitive tokens.
     * Uses AES-256-GCM encryption with PBKDF2 key derivation.
     *
     * @return configured TextEncryptor instance
     */
    @Bean
    public TextEncryptor tokenEncryptor() {
        return Encryptors.text(encryptionKey, salt);
    }
}
