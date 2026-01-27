package com.wellkorea.backend.shared.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

/**
 * JPA AttributeConverter for automatic encryption/decryption of string fields.
 * Encrypts data before storing in database and decrypts when reading.
 *
 * <p>Usage:
 * <pre>
 * &#64;Convert(converter = EncryptedStringConverter.class)
 * private String sensitiveField;
 * </pre>
 */
@Component
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private final TokenEncryptionService encryptionService;

    public EncryptedStringConverter(TokenEncryptionService encryptionService) {
        this.encryptionService = encryptionService;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return encryptionService.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return encryptionService.decrypt(dbData);
    }
}
