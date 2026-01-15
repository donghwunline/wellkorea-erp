package com.wellkorea.backend.production.domain;

/**
 * Allowed file types for blueprint attachments.
 * Supports common CAD and image formats used in manufacturing.
 */
public enum AllowedFileType {
    PDF("application/pdf", "PDF Document"),
    DXF("application/dxf", "AutoCAD DXF"),
    DWG("application/acad", "AutoCAD DWG"),
    JPG("image/jpeg", "JPEG Image"),
    PNG("image/png", "PNG Image");

    private final String mimeType;
    private final String description;

    AllowedFileType(String mimeType, String description) {
        this.mimeType = mimeType;
        this.description = description;
    }

    public String getMimeType() {
        return mimeType;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Get file type from file extension.
     *
     * @param fileName File name with extension
     * @return Matching AllowedFileType or null if not supported
     */
    public static AllowedFileType fromFileName(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return null;
        }

        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toUpperCase();
        return switch (extension) {
            case "PDF" -> PDF;
            case "DXF" -> DXF;
            case "DWG" -> DWG;
            case "JPG", "JPEG" -> JPG;
            case "PNG" -> PNG;
            default -> null;
        };
    }

    /**
     * Check if a file name has an allowed extension.
     *
     * @param fileName File name to check
     * @return true if file type is allowed
     */
    public static boolean isAllowed(String fileName) {
        return fromFileName(fileName) != null;
    }

    /**
     * Get comma-separated list of allowed extensions for error messages.
     */
    public static String getAllowedExtensions() {
        return "PDF, DXF, DWG, JPG, PNG";
    }
}
