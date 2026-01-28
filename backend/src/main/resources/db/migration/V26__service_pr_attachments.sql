-- =====================================================
-- V26: Service Purchase Request Attachments
-- =====================================================
-- Attachment references for ServicePurchaseRequest
-- Links to existing files in MinIO (from TaskFlow/BlueprintAttachment)
-- Used to include blueprints/drawings in RFQ emails for outsourcing services
-- =====================================================

CREATE TABLE service_pr_attachments (
    purchase_request_id     BIGINT NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    reference_id            VARCHAR(36) NOT NULL,
    file_name               VARCHAR(255) NOT NULL,
    file_type               VARCHAR(10) NOT NULL,
    file_size               BIGINT NOT NULL,
    storage_path            VARCHAR(500) NOT NULL,
    linked_by_id            BIGINT NOT NULL,
    linked_at               TIMESTAMP NOT NULL,

    PRIMARY KEY (purchase_request_id, reference_id),
    -- Prevent linking same file twice to same PR
    CONSTRAINT uq_service_pr_attachment_path UNIQUE (purchase_request_id, storage_path),
    -- Only allow supported file types
    CONSTRAINT chk_attachment_file_type CHECK (file_type IN ('PDF', 'DXF', 'DWG', 'JPG', 'PNG'))
);

-- Index for looking up attachments by purchase request
CREATE INDEX idx_service_pr_attachments_pr ON service_pr_attachments(purchase_request_id);

COMMENT ON TABLE service_pr_attachments IS 'Attachment references for ServicePurchaseRequest - links to existing files in MinIO';
COMMENT ON COLUMN service_pr_attachments.reference_id IS 'UUID identifying this attachment reference';
COMMENT ON COLUMN service_pr_attachments.storage_path IS 'MinIO storage path (from TaskFlow/BlueprintAttachment)';
COMMENT ON COLUMN service_pr_attachments.linked_by_id IS 'User who linked this attachment';
