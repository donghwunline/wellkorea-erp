package com.wellkorea.backend.shared.pdf;

import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

/**
 * Utility class for loading PDF fonts.
 * Loads font bytes once at class initialization time to avoid repeated I/O operations
 * and reduce memory churn during PDF generation.
 */
public final class PdfFontLoader {

    private static final byte[] NOTO_SANS_KR_BYTES;

    static {
        try (InputStream is = new ClassPathResource("fonts/NotoSansKR.ttf").getInputStream()) {
            NOTO_SANS_KR_BYTES = is.readAllBytes();
        } catch (IOException e) {
            throw new ExceptionInInitializerError("Failed to load NotoSansKR font: " + e.getMessage());
        }
    }

    private PdfFontLoader() {
        // Utility class - prevent instantiation
    }

    /**
     * Get the NotoSansKR font bytes.
     * Font bytes are loaded once at class initialization and cached statically.
     *
     * @return byte array containing the NotoSansKR font data
     */
    public static byte[] getNotoSansKrBytes() {
        return NOTO_SANS_KR_BYTES;
    }
}
