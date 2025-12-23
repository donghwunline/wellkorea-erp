-- V7: Approval domain tables for multi-level approval workflow (승인/결재)
-- Migration Date: 2025-12-19
-- Purpose: Support sequential multi-level approval with fixed chains per entity type
--          Approval levels reference specific approver users (팀장, 부서장, 사장 etc.)

-- =====================================================================
-- APPROVAL CHAIN CONFIGURATION (Fixed per entity type)
-- =====================================================================

-- Approval chain templates (defines the approval chain per entity type)
-- Example: Quotation might have 2 levels, PurchaseOrder might have 3 levels
CREATE TABLE approval_chain_templates
(
    id          BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50)  NOT NULL UNIQUE, -- QUOTATION, PURCHASE_ORDER
    name        VARCHAR(100) NOT NULL,         -- Human-readable name: "견적서 결재"
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_template_entity_type CHECK (entity_type IN ('QUOTATION', 'PURCHASE_ORDER'))
);

-- Approval chain levels (embeddable collection within template aggregate)
-- JPA @ElementCollection - no separate ID column, identified by chain_template_id + level_order
CREATE TABLE approval_chain_levels
(
    chain_template_id BIGINT       NOT NULL REFERENCES approval_chain_templates (id) ON DELETE CASCADE,
    level_order       INT          NOT NULL,            -- 1, 2, 3... (execution order: 1=팀장, 2=부서장, 3=사장)
    level_name        VARCHAR(100) NOT NULL,            -- Display name: "팀장", "부서장", "사장"
    approver_user_id  BIGINT       NOT NULL REFERENCES users (id), -- Specific user who can approve at this level
    is_required       BOOLEAN      NOT NULL DEFAULT true, -- Can this level be skipped?

    CONSTRAINT pk_approval_chain_levels PRIMARY KEY (chain_template_id, level_order),
    CONSTRAINT chk_level_order_positive CHECK (level_order > 0)
);

-- =====================================================================
-- APPROVAL REQUESTS (Instances for specific entities)
-- =====================================================================

-- Approval requests (tracks approval workflow for a specific entity)
-- Note: No FK to chain_template - level decisions capture template data at creation time
CREATE TABLE approval_requests
(
    id                 BIGSERIAL PRIMARY KEY,
    entity_type        VARCHAR(50) NOT NULL,          -- QUOTATION, PURCHASE_ORDER
    entity_id          BIGINT      NOT NULL,          -- ID of the entity being approved
    entity_description VARCHAR(500),                   -- Human-readable: "견적서 v3 - WK2K25-0001-0104"
    current_level      INT         NOT NULL DEFAULT 1, -- Which level we're currently at
    total_levels       INT         NOT NULL,           -- Total levels in chain (snapshot from template)
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    submitted_by_id    BIGINT      NOT NULL REFERENCES users (id),
    submitted_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at       TIMESTAMP,                       -- When final approval/rejection occurred
    created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_approval_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_entity_type CHECK (entity_type IN ('QUOTATION', 'PURCHASE_ORDER')),
    CONSTRAINT chk_current_level_valid CHECK (current_level >= 1),
    CONSTRAINT chk_total_levels_valid CHECK (total_levels >= 1),
    CONSTRAINT uq_approval_entity UNIQUE (entity_type, entity_id) -- One active approval per entity
);

-- Approval level decisions (embeddable collection within ApprovalRequest aggregate)
-- JPA @ElementCollection - no separate ID column, identified by approval_request_id + level_order
-- Note: level_name is denormalized from chain template at creation time (snapshot)
CREATE TABLE approval_level_decisions
(
    approval_request_id  BIGINT       NOT NULL REFERENCES approval_requests (id) ON DELETE CASCADE,
    level_order          INT          NOT NULL,          -- Which level this decision is for
    level_name           VARCHAR(100) NOT NULL,          -- Display name: "팀장", "부서장" (snapshot from template)
    expected_approver_id BIGINT       NOT NULL REFERENCES users (id), -- Who should approve at this level
    decision             VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    decided_by_id        BIGINT REFERENCES users (id),   -- Who actually made the decision
    decided_at           TIMESTAMP,
    comments             TEXT,

    CONSTRAINT pk_approval_level_decisions PRIMARY KEY (approval_request_id, level_order),
    CONSTRAINT chk_level_decision CHECK (decision IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Approval history (audit trail of all approval actions)
CREATE TABLE approval_history
(
    id                  BIGSERIAL PRIMARY KEY,
    approval_request_id BIGINT      NOT NULL REFERENCES approval_requests (id) ON DELETE CASCADE,
    level_order         INT,                           -- Which level this action was for (null for SUBMITTED)
    action              VARCHAR(20) NOT NULL,          -- SUBMITTED, APPROVED, REJECTED
    actor_id            BIGINT      NOT NULL REFERENCES users (id),
    comments            TEXT,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_history_action CHECK (action IN ('SUBMITTED', 'APPROVED', 'REJECTED'))
);

-- Approval comments (discussion/notes on approval requests)
CREATE TABLE approval_comments
(
    id                  BIGSERIAL PRIMARY KEY,
    approval_request_id BIGINT    NOT NULL REFERENCES approval_requests (id) ON DELETE CASCADE,
    commenter_id        BIGINT    NOT NULL REFERENCES users (id),
    comment_text        TEXT      NOT NULL,
    is_rejection_reason BOOLEAN   NOT NULL DEFAULT false, -- True if this is the mandatory rejection reason
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- INDEXES
-- =====================================================================

-- Approval chain templates indexes
CREATE INDEX idx_approval_chain_templates_entity_type ON approval_chain_templates (entity_type);
CREATE INDEX idx_approval_chain_templates_is_active ON approval_chain_templates (is_active);

-- Approval chain levels indexes (composite primary key already indexed)
CREATE INDEX idx_approval_chain_levels_approver ON approval_chain_levels (approver_user_id);

-- Approval requests indexes
CREATE INDEX idx_approval_requests_entity ON approval_requests (entity_type, entity_id);
CREATE INDEX idx_approval_requests_status ON approval_requests (status);
CREATE INDEX idx_approval_requests_current_level ON approval_requests (current_level);
CREATE INDEX idx_approval_requests_submitted_by ON approval_requests (submitted_by_id);
CREATE INDEX idx_approval_requests_submitted_at ON approval_requests (submitted_at);

-- Approval level decisions indexes (composite primary key already indexed)
CREATE INDEX idx_approval_level_decisions_expected_approver ON approval_level_decisions (expected_approver_id);
CREATE INDEX idx_approval_level_decisions_decided_by ON approval_level_decisions (decided_by_id) WHERE decided_by_id IS NOT NULL;
CREATE INDEX idx_approval_level_decisions_decision ON approval_level_decisions (decision);

-- Approval history indexes
CREATE INDEX idx_approval_history_request_id ON approval_history (approval_request_id);
CREATE INDEX idx_approval_history_actor_id ON approval_history (actor_id);
CREATE INDEX idx_approval_history_created_at ON approval_history (created_at);

-- Approval comments indexes
CREATE INDEX idx_approval_comments_request_id ON approval_comments (approval_request_id);
CREATE INDEX idx_approval_comments_commenter_id ON approval_comments (commenter_id);

-- =====================================================================
-- SEED DATA: Default approval chains
-- Note: Approver user IDs must be configured by Admin after initial setup
-- This creates the chain structure; Admin assigns specific users to each level
-- =====================================================================

-- Quotation approval chain structure (Admin configures specific users)
INSERT INTO approval_chain_templates (entity_type, name, description, is_active)
VALUES ('QUOTATION', '견적서 결재',
        '견적서 승인을 위한 결재 라인. 관리자가 각 레벨의 결재자를 지정합니다.', true);

-- Purchase Order approval chain structure
INSERT INTO approval_chain_templates (entity_type, name, description, is_active)
VALUES ('PURCHASE_ORDER', '발주서 결재',
        '발주서 승인을 위한 결재 라인. 관리자가 각 레벨의 결재자를 지정합니다.', true);

-- Note: approval_chain_levels will be populated by Admin via UI
-- Example structure when configured:
-- Level 1: 팀장 (Team Lead) - User ID X
-- Level 2: 부서장 (Department Head) - User ID Y
-- Level 3: 사장 (CEO) - User ID Z (if needed)

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE approval_chain_templates IS 'Defines approval chains per entity type (견적서, 발주서 등)';
COMMENT ON COLUMN approval_chain_templates.entity_type IS 'Entity type: QUOTATION, PURCHASE_ORDER';

COMMENT ON TABLE approval_chain_levels IS 'Embeddable collection of approvers in a chain (팀장 → 부서장 → 사장). No separate ID - part of template aggregate.';
COMMENT ON COLUMN approval_chain_levels.level_order IS 'Execution order: 1 = first approver (팀장), 2 = second (부서장), etc.';
COMMENT ON COLUMN approval_chain_levels.level_name IS 'Position title: 팀장, 부서장, 사장';
COMMENT ON COLUMN approval_chain_levels.approver_user_id IS 'Specific user ID who can approve at this level';

COMMENT ON TABLE approval_requests IS 'Tracks approval workflow instances';
COMMENT ON COLUMN approval_requests.current_level IS 'Which level the request is currently awaiting approval at';
COMMENT ON COLUMN approval_requests.total_levels IS 'Total number of levels in the chain';
COMMENT ON COLUMN approval_requests.status IS 'PENDING until all levels approve, APPROVED when complete, REJECTED if any level rejects';

COMMENT ON TABLE approval_level_decisions IS 'Embeddable collection tracking decisions at each level (part of ApprovalRequest aggregate). No separate ID - identified by approval_request_id + level_order.';
COMMENT ON COLUMN approval_level_decisions.level_name IS 'Display name snapshotted from chain template at creation time (팀장, 부서장, etc.)';
COMMENT ON COLUMN approval_level_decisions.expected_approver_id IS 'The user who should make this decision (snapshotted from chain config)';
COMMENT ON COLUMN approval_level_decisions.decided_by_id IS 'The user who actually made the decision';
COMMENT ON COLUMN approval_level_decisions.decision IS 'PENDING (waiting), APPROVED, REJECTED';

COMMENT ON TABLE approval_history IS 'Audit trail of all approval workflow actions';
COMMENT ON TABLE approval_comments IS 'Discussion comments and rejection reasons';
