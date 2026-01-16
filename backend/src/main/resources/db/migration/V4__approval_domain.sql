-- V4: Approval domain tables for multi-level approval workflow (승인/결재)
-- Supports sequential multi-level approval with fixed chains per entity type.

-- =====================================================================
-- APPROVAL CHAIN CONFIGURATION
-- =====================================================================

CREATE TABLE approval_chain_templates
(
    id          BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_template_entity_type CHECK (entity_type IN ('QUOTATION', 'PURCHASE_ORDER'))
);

CREATE TABLE approval_chain_levels
(
    chain_template_id BIGINT       NOT NULL REFERENCES approval_chain_templates (id) ON DELETE CASCADE,
    level_order       INT          NOT NULL,
    level_name        VARCHAR(100) NOT NULL,
    approver_user_id  BIGINT       NOT NULL REFERENCES users (id),
    is_required       BOOLEAN      NOT NULL DEFAULT true,
    CONSTRAINT pk_approval_chain_levels PRIMARY KEY (chain_template_id, level_order),
    CONSTRAINT chk_level_order_positive CHECK (level_order > 0)
);

-- =====================================================================
-- APPROVAL REQUESTS
-- =====================================================================

CREATE TABLE approval_requests
(
    id                 BIGSERIAL PRIMARY KEY,
    entity_type        VARCHAR(50) NOT NULL,
    entity_id          BIGINT      NOT NULL,
    entity_description VARCHAR(500),
    current_level      INT         NOT NULL DEFAULT 1,
    total_levels       INT         NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_by_id    BIGINT      NOT NULL REFERENCES users (id),
    submitted_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at       TIMESTAMP,
    created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_approval_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_entity_type CHECK (entity_type IN ('QUOTATION', 'PURCHASE_ORDER')),
    CONSTRAINT chk_current_level_valid CHECK (current_level >= 1),
    CONSTRAINT chk_total_levels_valid CHECK (total_levels >= 1),
    CONSTRAINT uq_approval_entity UNIQUE (entity_type, entity_id)
);

CREATE TABLE approval_level_decisions
(
    approval_request_id  BIGINT       NOT NULL REFERENCES approval_requests (id) ON DELETE CASCADE,
    level_order          INT          NOT NULL,
    level_name           VARCHAR(100) NOT NULL,
    expected_approver_id BIGINT       NOT NULL REFERENCES users (id),
    decision             VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    decided_by_id        BIGINT REFERENCES users (id),
    decided_at           TIMESTAMP,
    comments             TEXT,
    CONSTRAINT pk_approval_level_decisions PRIMARY KEY (approval_request_id, level_order),
    CONSTRAINT chk_level_decision CHECK (decision IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE approval_history
(
    id                  BIGSERIAL PRIMARY KEY,
    approval_request_id BIGINT      NOT NULL REFERENCES approval_requests (id) ON DELETE CASCADE,
    level_order         INT,
    action              VARCHAR(20) NOT NULL,
    actor_id            BIGINT      NOT NULL REFERENCES users (id),
    comments            TEXT,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_history_action CHECK (action IN ('SUBMITTED', 'APPROVED', 'REJECTED'))
);

CREATE TABLE approval_comments
(
    id                  BIGSERIAL PRIMARY KEY,
    approval_request_id BIGINT    NOT NULL REFERENCES approval_requests (id) ON DELETE CASCADE,
    commenter_id        BIGINT    NOT NULL REFERENCES users (id),
    comment_text        TEXT      NOT NULL,
    is_rejection_reason BOOLEAN   NOT NULL DEFAULT false,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_approval_chain_templates_entity_type ON approval_chain_templates (entity_type);
CREATE INDEX idx_approval_chain_templates_is_active ON approval_chain_templates (is_active);
CREATE INDEX idx_approval_chain_levels_approver ON approval_chain_levels (approver_user_id);

CREATE INDEX idx_approval_requests_entity ON approval_requests (entity_type, entity_id);
CREATE INDEX idx_approval_requests_status ON approval_requests (status);
CREATE INDEX idx_approval_requests_current_level ON approval_requests (current_level);
CREATE INDEX idx_approval_requests_submitted_by ON approval_requests (submitted_by_id);
CREATE INDEX idx_approval_requests_submitted_at ON approval_requests (submitted_at);

CREATE INDEX idx_approval_level_decisions_expected_approver ON approval_level_decisions (expected_approver_id);
CREATE INDEX idx_approval_level_decisions_decided_by ON approval_level_decisions (decided_by_id) WHERE decided_by_id IS NOT NULL;
CREATE INDEX idx_approval_level_decisions_decision ON approval_level_decisions (decision);

CREATE INDEX idx_approval_history_request_id ON approval_history (approval_request_id);
CREATE INDEX idx_approval_history_actor_id ON approval_history (actor_id);
CREATE INDEX idx_approval_history_created_at ON approval_history (created_at);

CREATE INDEX idx_approval_comments_request_id ON approval_comments (approval_request_id);
CREATE INDEX idx_approval_comments_commenter_id ON approval_comments (commenter_id);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE approval_chain_templates IS 'Defines approval chains per entity type (견적서, 발주서 등)';
COMMENT ON COLUMN approval_chain_templates.entity_type IS 'Entity type: QUOTATION, PURCHASE_ORDER';

COMMENT ON TABLE approval_chain_levels IS 'Approvers in a chain (팀장 → 부서장 → 사장)';
COMMENT ON COLUMN approval_chain_levels.level_order IS 'Execution order: 1 = first approver, 2 = second, etc.';
COMMENT ON COLUMN approval_chain_levels.level_name IS 'Position title: 팀장, 부서장, 사장';

COMMENT ON TABLE approval_requests IS 'Tracks approval workflow instances';
COMMENT ON COLUMN approval_requests.current_level IS 'Which level the request is currently awaiting approval at';
COMMENT ON COLUMN approval_requests.status IS 'PENDING until all levels approve, APPROVED when complete, REJECTED if any level rejects';

COMMENT ON TABLE approval_level_decisions IS 'Tracking decisions at each level';
COMMENT ON COLUMN approval_level_decisions.level_name IS 'Display name snapshotted from chain template at creation time';

COMMENT ON TABLE approval_history IS 'Audit trail of all approval workflow actions';
COMMENT ON TABLE approval_comments IS 'Discussion comments and rejection reasons';
