-- V19: Purchasing domain tables (PurchaseRequest, RFQItem, PurchaseOrder)
-- Migration Date: 2026-01-15
-- Purpose: Enable purchasing workflow with vendor RFQ and purchase order management
-- Note: service_categories and vendor_service_offerings already exist in V1__create_core_tables.sql

-- =====================================================================
-- PURCHASE REQUEST (Internal request for materials/services)
-- =====================================================================

CREATE TABLE purchase_requests
(
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT REFERENCES projects (id) ON DELETE SET NULL,      -- Optional: project reference
    service_category_id BIGINT         NOT NULL REFERENCES service_categories (id) ON DELETE RESTRICT,
    request_number      VARCHAR(50)    NOT NULL UNIQUE,                           -- PR-2025-001
    description         TEXT           NOT NULL,
    quantity            DECIMAL(10, 2) NOT NULL,
    uom                 VARCHAR(20),                                              -- Unit of measure
    required_date       DATE           NOT NULL,
    status              VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',                  -- DRAFT, RFQ_SENT, VENDOR_SELECTED, CLOSED, CANCELED
    created_by_id       BIGINT         NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_pr_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_pr_status CHECK (status IN ('DRAFT', 'RFQ_SENT', 'VENDOR_SELECTED', 'CLOSED', 'CANCELED'))
);

-- Indexes for purchase_requests
CREATE INDEX idx_purchase_requests_project ON purchase_requests (project_id);
CREATE INDEX idx_purchase_requests_service_category ON purchase_requests (service_category_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests (status);
CREATE INDEX idx_purchase_requests_created_by ON purchase_requests (created_by_id);
CREATE INDEX idx_purchase_requests_required_date ON purchase_requests (required_date);

-- =====================================================================
-- RFQ ITEM (Individual RFQ sent to a vendor)
-- =====================================================================

CREATE TABLE rfq_items
(
    id                  BIGSERIAL PRIMARY KEY,
    purchase_request_id BIGINT         NOT NULL REFERENCES purchase_requests (id) ON DELETE CASCADE,
    vendor_company_id   BIGINT         NOT NULL REFERENCES companies (id) ON DELETE RESTRICT,
    vendor_offering_id  BIGINT REFERENCES vendor_service_offerings (id) ON DELETE SET NULL, -- Optional catalog reference
    status              VARCHAR(20)    NOT NULL DEFAULT 'SENT',                   -- SENT, REPLIED, NO_RESPONSE, SELECTED, REJECTED
    quoted_price        DECIMAL(15, 2),                                           -- Vendor's quoted price
    quoted_lead_time    INTEGER,                                                  -- Vendor's quoted lead time in days
    notes               TEXT,                                                     -- Vendor notes/conditions
    sent_at             TIMESTAMP,                                                -- When RFQ was sent
    replied_at          TIMESTAMP,                                                -- When vendor replied
    created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_rfq_status CHECK (status IN ('SENT', 'REPLIED', 'NO_RESPONSE', 'SELECTED', 'REJECTED')),
    CONSTRAINT chk_rfq_quoted_price_positive CHECK (quoted_price IS NULL OR quoted_price >= 0),
    CONSTRAINT chk_rfq_lead_time_positive CHECK (quoted_lead_time IS NULL OR quoted_lead_time >= 0)
);

-- Indexes for rfq_items
CREATE INDEX idx_rfq_items_purchase_request ON rfq_items (purchase_request_id);
CREATE INDEX idx_rfq_items_vendor ON rfq_items (vendor_company_id);
CREATE INDEX idx_rfq_items_status ON rfq_items (status);
CREATE INDEX idx_rfq_items_vendor_offering ON rfq_items (vendor_offering_id);

-- Ensure only one RFQ item can be SELECTED per purchase request
CREATE UNIQUE INDEX idx_rfq_items_one_selected
    ON rfq_items (purchase_request_id)
    WHERE status = 'SELECTED';

-- =====================================================================
-- PURCHASE ORDER (Order to vendor based on selected RFQ)
-- =====================================================================

CREATE TABLE purchase_orders
(
    id                     BIGSERIAL PRIMARY KEY,
    rfq_item_id            BIGINT         NOT NULL REFERENCES rfq_items (id) ON DELETE RESTRICT,
    project_id             BIGINT REFERENCES projects (id) ON DELETE SET NULL,   -- Optional: from PurchaseRequest
    vendor_company_id      BIGINT         NOT NULL REFERENCES companies (id) ON DELETE RESTRICT,
    po_number              VARCHAR(50)    NOT NULL UNIQUE,                        -- PO-2025-001
    order_date             DATE           NOT NULL,
    expected_delivery_date DATE           NOT NULL,
    total_amount           DECIMAL(15, 2) NOT NULL,
    currency               VARCHAR(3)              DEFAULT 'KRW',
    status                 VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',               -- DRAFT, SENT, CONFIRMED, RECEIVED, CANCELED
    notes                  TEXT,
    created_by_id          BIGINT         NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at             TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_po_total_positive CHECK (total_amount >= 0),
    CONSTRAINT chk_po_delivery_after_order CHECK (expected_delivery_date >= order_date),
    CONSTRAINT chk_po_status CHECK (status IN ('DRAFT', 'SENT', 'CONFIRMED', 'RECEIVED', 'CANCELED'))
);

-- Indexes for purchase_orders
CREATE INDEX idx_purchase_orders_rfq_item ON purchase_orders (rfq_item_id);
CREATE INDEX idx_purchase_orders_project ON purchase_orders (project_id);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders (vendor_company_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders (status);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders (created_by_id);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders (order_date);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE purchase_requests IS 'Internal request for purchasing materials or outsourcing services';
COMMENT ON COLUMN purchase_requests.project_id IS 'Optional project reference (null for general purchases)';
COMMENT ON COLUMN purchase_requests.request_number IS 'Unique request ID: PR-YYYY-NNNNNN';
COMMENT ON COLUMN purchase_requests.status IS 'DRAFT → RFQ_SENT → VENDOR_SELECTED → CLOSED, or CANCELED';

COMMENT ON TABLE rfq_items IS 'Individual RFQ sent to a specific vendor for a purchase request';
COMMENT ON COLUMN rfq_items.vendor_offering_id IS 'Reference to vendor catalog offering (optional)';
COMMENT ON COLUMN rfq_items.status IS 'SENT → REPLIED → SELECTED/REJECTED, or NO_RESPONSE';
COMMENT ON COLUMN rfq_items.quoted_price IS 'Vendor quoted price (required when status = REPLIED)';

COMMENT ON TABLE purchase_orders IS 'Official order to vendor based on selected RFQ response';
COMMENT ON COLUMN purchase_orders.po_number IS 'Unique PO ID: PO-YYYY-NNNNNN';
COMMENT ON COLUMN purchase_orders.status IS 'DRAFT → SENT → CONFIRMED → RECEIVED, or CANCELED';
