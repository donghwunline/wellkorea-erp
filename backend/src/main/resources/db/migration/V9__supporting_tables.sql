-- V9: Supporting tables - Audit log, Distributed lock, Blueprint attachments
-- Cross-cutting infrastructure for auditing, locking, and file attachments.

-- =====================================================================
-- AUDIT LOG TABLE (Immutable)
-- =====================================================================

CREATE TABLE audit_logs
(
    id          BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   BIGINT       NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    user_id     BIGINT REFERENCES users (id),
    username    VARCHAR(100),
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    changes     JSONB,
    metadata    JSONB,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_audit_action CHECK (action IN (
        'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD',
        'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'ACCESS_DENIED'
    ))
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_user_entity_type ON audit_logs (user_id, entity_type, created_at DESC);
CREATE INDEX idx_audit_logs_changes ON audit_logs USING GIN (changes);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata);

-- Prevent modifications to audit log
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log is immutable. Cannot modify or delete audit records.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_log_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER trg_prevent_audit_log_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    changes_json JSONB;
    old_data JSONB;
    new_data JSONB;
    action_type VARCHAR(50);
BEGIN
    IF TG_OP = 'INSERT' THEN
        action_type := 'CREATE';
        new_data := to_jsonb(NEW);
        changes_json := jsonb_build_object('new', new_data);
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        changes_json := jsonb_build_object('old', old_data, 'new', new_data);
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        old_data := to_jsonb(OLD);
        changes_json := jsonb_build_object('old', old_data);
    END IF;

    INSERT INTO audit_logs (entity_type, entity_id, action, changes)
    VALUES (TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), action_type, changes_json);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER trg_audit_projects
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER trg_audit_companies
    AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================================
-- DISTRIBUTED LOCK TABLE (Spring Integration)
-- =====================================================================

CREATE TABLE INT_LOCK (
    LOCK_KEY     VARCHAR(255) NOT NULL,
    REGION       VARCHAR(100) NOT NULL,
    CLIENT_ID    VARCHAR(255) NOT NULL,
    CREATED_DATE TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT INT_LOCK_PK PRIMARY KEY (LOCK_KEY, REGION)
);

CREATE INDEX idx_int_lock_region ON INT_LOCK (REGION);

-- =====================================================================
-- BLUEPRINT ATTACHMENTS
-- =====================================================================

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
    CONSTRAINT uq_blueprint_per_node UNIQUE (task_flow_id, node_id, file_name),
    CONSTRAINT chk_file_type CHECK (file_type IN ('PDF', 'DXF', 'DWG', 'JPG', 'PNG')),
    CONSTRAINT chk_file_size CHECK (file_size > 0 AND file_size <= 52428800)
);

CREATE INDEX idx_blueprint_flow_node ON blueprint_attachments(task_flow_id, node_id);
CREATE INDEX idx_blueprint_uploaded_by ON blueprint_attachments(uploaded_by_id);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all data changes and sensitive access';
COMMENT ON COLUMN audit_logs.entity_type IS 'Table name of the affected entity';
COMMENT ON COLUMN audit_logs.entity_id IS 'Primary key of the affected record';
COMMENT ON COLUMN audit_logs.action IS 'Type of action: CREATE, UPDATE, DELETE, VIEW, DOWNLOAD, APPROVE, REJECT, etc.';
COMMENT ON COLUMN audit_logs.changes IS 'JSONB field containing before/after state of changed fields';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context like approval comments, deletion reasons, etc.';

COMMENT ON TABLE INT_LOCK IS 'Spring Integration distributed lock table for preventing race conditions';
COMMENT ON COLUMN INT_LOCK.LOCK_KEY IS 'Lock identifier (e.g., project:123)';
COMMENT ON COLUMN INT_LOCK.REGION IS 'Lock region for namespace isolation';
COMMENT ON COLUMN INT_LOCK.CLIENT_ID IS 'UUID of the client holding the lock';

COMMENT ON TABLE blueprint_attachments IS 'File attachments for outsourced task nodes in TaskFlow';
COMMENT ON COLUMN blueprint_attachments.task_flow_id IS 'References the TaskFlow containing this node';
COMMENT ON COLUMN blueprint_attachments.node_id IS 'References TaskNode.node_id within the TaskFlow';
COMMENT ON COLUMN blueprint_attachments.file_type IS 'File format: PDF, DXF, DWG, JPG, PNG';
COMMENT ON COLUMN blueprint_attachments.file_size IS 'File size in bytes (max 50MB)';
COMMENT ON COLUMN blueprint_attachments.storage_path IS 'MinIO object path';
