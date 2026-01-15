-- V18__create_blueprint_attachments.sql
-- Blueprint attachments for outsourced task nodes (US7)
-- Allows attaching drawings/blueprints to TaskFlow nodes for vendor communication

-- ============================================================================
-- BlueprintAttachment: File attachments for outsourced tasks
-- ============================================================================

CREATE TABLE blueprint_attachments (
    id                  BIGSERIAL PRIMARY KEY,
    task_flow_id        BIGINT NOT NULL REFERENCES task_flows(id) ON DELETE CASCADE,
    node_id             VARCHAR(36) NOT NULL,
    file_name           VARCHAR(255) NOT NULL,
    file_type           VARCHAR(10) NOT NULL,
    file_size           BIGINT NOT NULL,
    storage_path        VARCHAR(500) NOT NULL,
    uploaded_by_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: no duplicate file names per task node
    CONSTRAINT uq_blueprint_per_node UNIQUE (task_flow_id, node_id, file_name),

    -- File type validation
    CONSTRAINT chk_file_type CHECK (file_type IN ('PDF', 'DXF', 'DWG', 'JPG', 'PNG')),

    -- File size validation (max 50MB)
    CONSTRAINT chk_file_size CHECK (file_size > 0 AND file_size <= 52428800)
);

-- Indexes for performance
CREATE INDEX idx_blueprint_flow_node ON blueprint_attachments(task_flow_id, node_id);
CREATE INDEX idx_blueprint_uploaded_by ON blueprint_attachments(uploaded_by_id);

-- Comments
COMMENT ON TABLE blueprint_attachments IS 'File attachments for outsourced task nodes in TaskFlow (US7)';
COMMENT ON COLUMN blueprint_attachments.task_flow_id IS 'References the TaskFlow containing this node';
COMMENT ON COLUMN blueprint_attachments.node_id IS 'References TaskNode.node_id within the TaskFlow';
COMMENT ON COLUMN blueprint_attachments.file_name IS 'Original file name as uploaded';
COMMENT ON COLUMN blueprint_attachments.file_type IS 'File format: PDF, DXF, DWG, JPG, PNG';
COMMENT ON COLUMN blueprint_attachments.file_size IS 'File size in bytes (max 50MB)';
COMMENT ON COLUMN blueprint_attachments.storage_path IS 'MinIO object path (e.g., blueprints/flow-1/node-abc/drawing.pdf)';
COMMENT ON COLUMN blueprint_attachments.uploaded_by_id IS 'User who uploaded the file';
