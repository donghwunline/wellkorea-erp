-- V4: Audit log for immutable audit trail
-- Migration Date: 2025-12-03
-- Purpose: Track all sensitive data changes and document access (US9 requirement)

-- =====================================================================
-- AUDIT LOG TABLE
-- =====================================================================

-- Audit log (immutable trail of all data changes and sensitive access)
CREATE TABLE audit_logs
(
    id          BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,        -- e.g., "Project", "Quotation", "TaxInvoice"
    entity_id   BIGINT       NOT NULL,        -- ID of the affected entity
    action      VARCHAR(50)  NOT NULL,        -- CREATE, UPDATE, DELETE, VIEW, DOWNLOAD, APPROVE, REJECT
    user_id     BIGINT REFERENCES users (id), -- User who performed the action (nullable for system actions)
    username    VARCHAR(100),                 -- Denormalized for audit retention
    ip_address  VARCHAR(45),                  -- IPv4 or IPv6 address
    user_agent  TEXT,                         -- Browser/client info
    changes     JSONB,                        -- Detailed change log: {"field": {"old": "value1", "new": "value2"}}
    metadata    JSONB,                        -- Additional context (e.g., reason for deletion, approval comments)
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_audit_action CHECK (action IN (
        'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD',
        'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'ACCESS_DENIED'
        )
)
    );

-- =====================================================================
-- INDEXES FOR AUDIT QUERIES
-- =====================================================================

-- Query by entity (find all changes for a specific record)
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- Query by user (find all actions by a user)
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);

-- Query by action (find all deletions, approvals, etc.)
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

-- Query by timestamp (recent activity)
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- Composite query: user actions on specific entity type
CREATE INDEX idx_audit_logs_user_entity_type ON audit_logs (user_id, entity_type, created_at DESC);

-- GIN index for JSONB changes and metadata (advanced filtering)
CREATE INDEX idx_audit_logs_changes ON audit_logs USING GIN(changes);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata);

-- =====================================================================
-- PREVENT MODIFICATIONS (IMMUTABLE AUDIT TRAIL)
-- =====================================================================

-- Create function to prevent UPDATE and DELETE on audit_logs
CREATE
OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE
EXCEPTION 'Audit log is immutable. Cannot modify or delete audit records.';
RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- Trigger to enforce immutability
CREATE TRIGGER trg_prevent_audit_log_update
    BEFORE UPDATE
    ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER trg_prevent_audit_log_delete
    BEFORE DELETE
    ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- =====================================================================
-- AUTO-AUDIT TRIGGERS FOR SENSITIVE TABLES
-- =====================================================================

-- Generic audit trigger function (captures before/after state)
CREATE
OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
changes_json JSONB;
    old_data
JSONB;
    new_data
JSONB;
    action_type
VARCHAR(50);
BEGIN
    -- Determine action type
    IF
TG_OP = 'INSERT' THEN
        action_type := 'CREATE';
        new_data
:= to_jsonb(NEW);
        changes_json
:= jsonb_build_object('new', new_data);
    ELSIF
TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        old_data
:= to_jsonb(OLD);
        new_data
:= to_jsonb(NEW);
        -- Only log fields that changed
        changes_json
:= jsonb_build_object('old', old_data, 'new', new_data);
    ELSIF
TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        old_data
:= to_jsonb(OLD);
        changes_json
:= jsonb_build_object('old', old_data);
END IF;

    -- Insert audit log entry
INSERT INTO audit_logs (entity_type, entity_id, action, changes)
VALUES (TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        action_type,
        changes_json);

RETURN COALESCE(NEW, OLD);
END;
$$
LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables (will be extended in future migrations)
-- Projects
CREATE TRIGGER trg_audit_projects
    AFTER INSERT OR
UPDATE OR
DELETE
ON projects
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Users (track user account changes)
CREATE TRIGGER trg_audit_users
    AFTER INSERT OR
UPDATE OR
DELETE
ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Customers
CREATE TRIGGER trg_audit_customers
    AFTER INSERT OR
UPDATE OR
DELETE
ON customers
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT
ON TABLE audit_logs IS 'Immutable audit trail for all data changes and sensitive access (US9 requirement)';
COMMENT
ON COLUMN audit_logs.entity_type IS 'Table name of the affected entity';
COMMENT
ON COLUMN audit_logs.entity_id IS 'Primary key of the affected record';
COMMENT
ON COLUMN audit_logs.action IS 'Type of action: CREATE, UPDATE, DELETE, VIEW, DOWNLOAD, APPROVE, REJECT, etc.';
COMMENT
ON COLUMN audit_logs.changes IS 'JSONB field containing before/after state of changed fields';
COMMENT
ON COLUMN audit_logs.metadata IS 'Additional context like approval comments, deletion reasons, etc.';
COMMENT
ON FUNCTION prevent_audit_log_modification() IS 'Enforces immutability of audit log';
COMMENT
ON FUNCTION audit_trigger_function() IS 'Generic trigger function to automatically log all changes to sensitive tables';
