-- V13: Extensible Approval Pattern - ApprovalState for Approvable entities
-- Consolidates all ApprovalState embedded columns for entities implementing Approvable interface.
-- Enables approval workflows for Quotation, PurchaseRequest (vendor selection), etc.

-- =====================================================================
-- 1. UPDATE ENTITY TYPE CONSTRAINTS (add VENDOR_SELECTION)
-- =====================================================================

ALTER TABLE approval_chain_templates
    DROP CONSTRAINT IF EXISTS chk_template_entity_type;
ALTER TABLE approval_chain_templates
    ADD CONSTRAINT chk_template_entity_type
    CHECK (entity_type IN ('QUOTATION', 'PURCHASE_ORDER', 'VENDOR_SELECTION'));

ALTER TABLE approval_requests
    DROP CONSTRAINT IF EXISTS chk_entity_type;
ALTER TABLE approval_requests
    ADD CONSTRAINT chk_entity_type
    CHECK (entity_type IN ('QUOTATION', 'PURCHASE_ORDER', 'VENDOR_SELECTION'));

-- =====================================================================
-- 2. ADD APPROVAL STATE COLUMNS TO QUOTATIONS
-- =====================================================================

ALTER TABLE quotations
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS approval_context VARCHAR(50),
    ADD COLUMN IF NOT EXISTS approval_submitted_by_id BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS approval_submitted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS approval_completed_by_id BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS approval_completed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS approval_rejection_reason TEXT;

ALTER TABLE quotations
    DROP CONSTRAINT IF EXISTS chk_quotation_approval_status;
ALTER TABLE quotations
    ADD CONSTRAINT chk_quotation_approval_status
    CHECK (approval_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED'));

CREATE INDEX IF NOT EXISTS idx_quotations_approval_completed_by
    ON quotations (approval_completed_by_id)
    WHERE approval_completed_by_id IS NOT NULL;

-- =====================================================================
-- 3. ADD APPROVAL STATE COLUMNS TO PURCHASE_REQUESTS
-- =====================================================================

-- Note: We don't store approval_request_id because we can query ApprovalRequest
-- by (entity_type='VENDOR_SELECTION', entity_id=purchase_request_id) when needed.

ALTER TABLE purchase_requests
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS approval_context VARCHAR(50),
    ADD COLUMN IF NOT EXISTS pending_selected_rfq_item_id VARCHAR(36),
    -- Audit trail columns
    ADD COLUMN IF NOT EXISTS approval_submitted_by_id BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS approval_submitted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS approval_completed_by_id BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS approval_completed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS approval_rejection_reason TEXT;

ALTER TABLE purchase_requests
    DROP CONSTRAINT IF EXISTS chk_pr_approval_status;
ALTER TABLE purchase_requests
    ADD CONSTRAINT chk_pr_approval_status
    CHECK (approval_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED'));

-- =====================================================================
-- 4. UPDATE PURCHASE REQUEST STATUS CONSTRAINT (add PENDING_VENDOR_APPROVAL)
-- =====================================================================

-- Expand status column to accommodate PENDING_VENDOR_APPROVAL (23 chars)
-- Original V8__purchasing_domain.sql defined it as VARCHAR(20), which is too small
ALTER TABLE purchase_requests
    ALTER COLUMN status TYPE VARCHAR(30);

ALTER TABLE purchase_requests
    DROP CONSTRAINT IF EXISTS chk_pr_status;
ALTER TABLE purchase_requests
    ADD CONSTRAINT chk_pr_status
    CHECK (status IN ('DRAFT', 'RFQ_SENT', 'PENDING_VENDOR_APPROVAL',
                      'VENDOR_SELECTED', 'ORDERED', 'CLOSED', 'CANCELED'));

-- =====================================================================
-- 5. SEED: APPROVAL CHAIN TEMPLATE FOR VENDOR_SELECTION
-- =====================================================================

INSERT INTO approval_chain_templates (entity_type, name, description, is_active, created_at, updated_at)
VALUES ('VENDOR_SELECTION', '업체선정 결재', '업체 선정 시 승인 절차', true, NOW(), NOW())
ON CONFLICT (entity_type) DO NOTHING;

-- Note: Approval levels need to be configured via admin UI or separate migration.
-- Example (replace with actual user IDs after template is created):
-- INSERT INTO approval_chain_levels (chain_template_id, level_order, level_name, approver_user_id, is_required)
-- SELECT id, 1, '재무팀장', 2, true FROM approval_chain_templates WHERE entity_type = 'VENDOR_SELECTION';

-- =====================================================================
-- COMMENTS
-- =====================================================================

-- Quotations
COMMENT ON COLUMN quotations.approval_status IS 'Embedded approval state: NONE, PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN quotations.approval_context IS 'Approval context identifier (e.g., QUOTATION)';
COMMENT ON COLUMN quotations.approval_submitted_by_id IS 'User ID who submitted for approval';
COMMENT ON COLUMN quotations.approval_submitted_at IS 'Timestamp when submitted for approval';
COMMENT ON COLUMN quotations.approval_completed_by_id IS 'User ID who completed the approval';
COMMENT ON COLUMN quotations.approval_completed_at IS 'Timestamp when approval was completed';
COMMENT ON COLUMN quotations.approval_rejection_reason IS 'Reason for rejection, if applicable';

-- Purchase Requests
COMMENT ON COLUMN purchase_requests.approval_status IS 'Embedded approval state: NONE, PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN purchase_requests.approval_context IS 'Approval context identifier (e.g., VENDOR_SELECTION)';
COMMENT ON COLUMN purchase_requests.pending_selected_rfq_item_id IS 'RFQ item ID pending approval for selection';
COMMENT ON COLUMN purchase_requests.approval_submitted_by_id IS 'User ID who submitted for approval';
COMMENT ON COLUMN purchase_requests.approval_submitted_at IS 'Timestamp when submitted for approval';
COMMENT ON COLUMN purchase_requests.approval_completed_by_id IS 'User ID who completed the approval';
COMMENT ON COLUMN purchase_requests.approval_completed_at IS 'Timestamp when approval was completed';
COMMENT ON COLUMN purchase_requests.approval_rejection_reason IS 'Reason for rejection, if applicable';
