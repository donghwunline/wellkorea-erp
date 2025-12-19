-- V6: Quotation domain tables for sales quotations and line items
-- Migration Date: 2025-12-19
-- Purpose: Support quotation creation with product catalog selection, versioning, and status tracking

-- =====================================================================
-- QUOTATION DOMAIN
-- =====================================================================

-- Quotations table (sales quotations linked to projects)
CREATE TABLE quotations
(
    id               BIGSERIAL PRIMARY KEY,
    project_id       BIGINT         NOT NULL REFERENCES projects (id),
    version          INT            NOT NULL DEFAULT 1,
    status           VARCHAR(20)    NOT NULL DEFAULT 'DRAFT', -- DRAFT, PENDING, APPROVED, SENT, REJECTED, ACCEPTED
    quotation_date   DATE           NOT NULL DEFAULT CURRENT_DATE,
    validity_days    INT            NOT NULL DEFAULT 30,       -- Quote valid for X days
    total_amount     DECIMAL(15, 2) NOT NULL DEFAULT 0,
    notes            TEXT,
    created_by_id    BIGINT         NOT NULL REFERENCES users (id),
    submitted_at     TIMESTAMP,                                 -- When submitted for approval
    approved_at      TIMESTAMP,                                 -- When approved
    approved_by_id   BIGINT REFERENCES users (id),
    rejection_reason TEXT,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN        NOT NULL DEFAULT false,

    CONSTRAINT chk_quotation_status CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'SENT', 'REJECTED', 'ACCEPTED')),
    CONSTRAINT chk_quotation_version_positive CHECK (version > 0),
    CONSTRAINT chk_validity_days_positive CHECK (validity_days > 0),
    CONSTRAINT uq_quotation_project_version UNIQUE (project_id, version)
);

-- Quotation line items (products selected for quotation with quantity and price)
CREATE TABLE quotation_line_items
(
    id           BIGSERIAL PRIMARY KEY,
    quotation_id BIGINT         NOT NULL REFERENCES quotations (id) ON DELETE CASCADE,
    product_id   BIGINT         NOT NULL REFERENCES products (id),
    sequence     INT            NOT NULL DEFAULT 1, -- Display order
    quantity     DECIMAL(10, 2) NOT NULL,
    unit_price   DECIMAL(15, 2) NOT NULL,
    line_total   DECIMAL(15, 2) NOT NULL,           -- quantity * unit_price (computed/denormalized)
    notes        TEXT,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_line_item_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_line_item_unit_price_non_negative CHECK (unit_price >= 0),
    CONSTRAINT chk_line_item_line_total_non_negative CHECK (line_total >= 0),
    CONSTRAINT uq_quotation_line_sequence UNIQUE (quotation_id, sequence)
);

-- =====================================================================
-- INDEXES
-- =====================================================================

-- Quotations indexes
CREATE INDEX idx_quotations_project_id ON quotations (project_id);
CREATE INDEX idx_quotations_status ON quotations (status);
CREATE INDEX idx_quotations_created_by_id ON quotations (created_by_id);
CREATE INDEX idx_quotations_quotation_date ON quotations (quotation_date);
CREATE INDEX idx_quotations_created_at ON quotations (created_at);
CREATE INDEX idx_quotations_is_deleted ON quotations (is_deleted);
CREATE INDEX idx_quotations_approved_by_id ON quotations (approved_by_id) WHERE approved_by_id IS NOT NULL;

-- Quotation line items indexes
CREATE INDEX idx_quotation_line_items_quotation_id ON quotation_line_items (quotation_id);
CREATE INDEX idx_quotation_line_items_product_id ON quotation_line_items (product_id);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE quotations IS 'Sales quotations linked to projects. Supports versioning and approval workflow.';
COMMENT ON COLUMN quotations.version IS 'Quotation version number (incremented when creating new version)';
COMMENT ON COLUMN quotations.status IS 'Quotation lifecycle: DRAFT → PENDING → APPROVED/REJECTED → SENT → ACCEPTED';
COMMENT ON COLUMN quotations.validity_days IS 'Number of days the quote is valid from quotation_date';
COMMENT ON COLUMN quotations.total_amount IS 'Sum of all line item totals (denormalized for performance)';
COMMENT ON COLUMN quotations.submitted_at IS 'Timestamp when quotation was submitted for approval';
COMMENT ON COLUMN quotations.approved_at IS 'Timestamp when quotation was approved';

COMMENT ON TABLE quotation_line_items IS 'Line items for quotations with product selection and pricing';
COMMENT ON COLUMN quotation_line_items.sequence IS 'Display order of line items within quotation';
COMMENT ON COLUMN quotation_line_items.unit_price IS 'Price per unit (can differ from product catalog price)';
COMMENT ON COLUMN quotation_line_items.line_total IS 'Computed: quantity × unit_price';
