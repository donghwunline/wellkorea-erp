package com.wellkorea.backend.shared.security;

import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;

/**
 * Service for encrypting and decrypting sensitive tokens.
 * Used primarily for refresh token storage in the database.
 */
@Service
public class TokenEncryptionService {

    private final TextEncryptor encryptor;

    public TokenEncryptionService(TextEncryptor encryptor) {
        this.encryptor = encryptor;
    }

    /**
     * Encrypts plain text using AES-256 encryption.
     *
     * @param plainText the text to encrypt
     * @return encrypted text (base64 encoded)
     */
    public String encrypt(String plainText) {
        if (plainText == null) {
            return null;
        }
        return encryptor.encrypt(plainText);
    }

    /**
     * Decrypts encrypted text.
     *
     * @param cipherText the encrypted text (base64 encoded)
     * @return decrypted plain text
     */
    public String decrypt(String cipherText) {
        if (cipherText == null) {
            return null;
        }
        return encryptor.decrypt(cipherText);
    }
}
