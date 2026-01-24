package com.wellkorea.backend.shared.storage.domain;

/**
 * Enum defining allowed file types for attachments.
 */
public enum AttachmentFileType {

    JPG("image/jpeg", "JPEG Image"),
    PNG("image/png", "PNG Image"),
    PDF("application/pdf", "PDF Document");

    private final String mimeType;
    private final String displayName;

    AttachmentFileType(String mimeType, String displayName) {
        this.mimeType = mimeType;
        this.displayName = displayName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Get file type from filename extension.
     *
     * @param fileName File name with extension
     * @return AttachmentFileType for the file
     * @throws IllegalArgumentException if file type is not supported
     */
    public static AttachmentFileType fromFileName(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            throw new IllegalArgumentException("Invalid file name: " + fileName);
        }

        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();

        return switch (extension) {
            case "jpg", "jpeg" -> JPG;
            case "png" -> PNG;
            case "pdf" -> PDF;
            default -> throw new IllegalArgumentException("Unsupported file type: " + extension);
        };
    }

    /**
     * Check if file is an allowed image type (JPG or PNG only).
     *
     * @param fileName File name with extension
     * @return true if file is a supported image type
     */
    public static boolean isAllowedImage(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return false;
        }

        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        return extension.equals("jpg") || extension.equals("jpeg") || extension.equals("png");
    }

    /**
     * Check if file is an allowed type (JPG, PNG, or PDF).
     *
     * @param fileName File name with extension
     * @return true if file is a supported type
     */
    public static boolean isAllowed(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return false;
        }

        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        return switch (extension) {
            case "jpg", "jpeg", "png", "pdf" -> true;
            default -> false;
        };
    }

    /**
     * Get file type from MIME type.
     *
     * @param mimeType MIME type string
     * @return AttachmentFileType for the MIME type
     * @throws IllegalArgumentException if MIME type is not supported
     */
    public static AttachmentFileType fromMimeType(String mimeType) {
        if (mimeType == null) {
            throw new IllegalArgumentException("MIME type cannot be null");
        }

        for (AttachmentFileType type : values()) {
            if (type.mimeType.equals(mimeType)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unsupported MIME type: " + mimeType);
    }
}
