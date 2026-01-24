-- ============================================================================
-- V18: Attachments table for generic file attachments
-- ============================================================================
-- Supports file attachments for multiple entity types using polymorphic pattern.
-- Initial use case: Delivery proof-of-delivery photos.
-- Extensible for: Quotation documents, Invoice copies, Project files.
-- ============================================================================

-- Generic attachments table for multiple entity types
CREATE TABLE attachments (
    id              BIGSERIAL PRIMARY KEY,
    owner_type      VARCHAR(20) NOT NULL,
    owner_id        BIGINT NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_type       VARCHAR(10) NOT NULL,
    file_size       BIGINT NOT NULL,
    storage_path    VARCHAR(500) NOT NULL,
    uploaded_by_id  BIGINT NOT NULL REFERENCES users(id),
    uploaded_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constrain owner_type to known entity types
    CONSTRAINT chk_attachment_owner_type
        CHECK (owner_type IN ('DELIVERY', 'QUOTATION', 'INVOICE', 'PROJECT')),

    -- Constrain file_type to allowed types
    CONSTRAINT chk_attachment_file_type
        CHECK (file_type IN ('JPG', 'PNG', 'PDF')),

    -- File size limit: 10MB max
    CONSTRAINT chk_attachment_file_size
        CHECK (file_size > 0 AND file_size <= 10485760)
);

-- Index for querying attachments by owner (most common query pattern)
CREATE INDEX idx_attachments_owner ON attachments(owner_type, owner_id);

-- Index for finding attachments by uploader (for audit/admin queries)
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by_id);

COMMENT ON TABLE attachments IS 'Generic file attachments for various entities (deliveries, quotations, invoices, projects)';
COMMENT ON COLUMN attachments.owner_type IS 'Type of entity that owns this attachment: DELIVERY, QUOTATION, INVOICE, or PROJECT';
COMMENT ON COLUMN attachments.owner_id IS 'ID of the owning entity';
COMMENT ON COLUMN attachments.file_name IS 'Original file name as uploaded';
COMMENT ON COLUMN attachments.file_type IS 'File type: JPG, PNG, or PDF';
COMMENT ON COLUMN attachments.file_size IS 'File size in bytes (max 10MB)';
COMMENT ON COLUMN attachments.storage_path IS 'Path to file in MinIO storage';
COMMENT ON COLUMN attachments.uploaded_by_id IS 'User who uploaded the file';
COMMENT ON COLUMN attachments.uploaded_at IS 'Timestamp when file was uploaded';
