-- V8: Purchasing domain - Materials, PurchaseRequest (with inheritance), RFQ, PurchaseOrder
-- Enables purchasing workflow with vendor RFQ and purchase order management.
-- Uses JPA SINGLE_TABLE inheritance for SERVICE and MATERIAL purchase requests.

-- =====================================================================
-- MATERIAL CATEGORIES TABLE
-- =====================================================================

CREATE TABLE material_categories
(
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_material_categories_name ON material_categories (name);
CREATE INDEX idx_material_categories_active ON material_categories (is_active);

-- =====================================================================
-- MATERIALS TABLE
-- =====================================================================

CREATE TABLE materials
(
    id                    BIGSERIAL PRIMARY KEY,
    sku                   VARCHAR(50)  NOT NULL UNIQUE,
    name                  VARCHAR(200) NOT NULL,
    description           TEXT,
    category_id           BIGINT       NOT NULL REFERENCES material_categories (id) ON DELETE RESTRICT,
    unit                  VARCHAR(20)  NOT NULL DEFAULT 'EA',
    standard_price        DECIMAL(15, 2),
    preferred_vendor_id   BIGINT REFERENCES companies (id) ON DELETE SET NULL,
    is_active             BOOLEAN      NOT NULL DEFAULT true,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_materials_standard_price CHECK (standard_price IS NULL OR standard_price >= 0)
);

CREATE INDEX idx_materials_sku ON materials (sku);
CREATE INDEX idx_materials_name ON materials (name);
CREATE INDEX idx_materials_category ON materials (category_id);
CREATE INDEX idx_materials_vendor ON materials (preferred_vendor_id);
CREATE INDEX idx_materials_active ON materials (is_active);

-- =====================================================================
-- PURCHASE REQUESTS (Supports SINGLE_TABLE inheritance)
-- dtype = 'SERVICE' or 'MATERIAL'
-- =====================================================================

CREATE TABLE purchase_requests
(
    id                  BIGSERIAL PRIMARY KEY,
    dtype               VARCHAR(31)    NOT NULL DEFAULT 'SERVICE',
    project_id          BIGINT REFERENCES projects (id) ON DELETE SET NULL,
    service_category_id BIGINT REFERENCES service_categories (id) ON DELETE RESTRICT,
    material_id         BIGINT REFERENCES materials (id) ON DELETE RESTRICT,
    request_number      VARCHAR(50)    NOT NULL UNIQUE,
    description         TEXT           NOT NULL,
    quantity            DECIMAL(10, 2) NOT NULL,
    uom                 VARCHAR(20),
    required_date       DATE           NOT NULL,
    status              VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',
    created_by_id       BIGINT         NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pr_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_pr_status CHECK (status IN ('DRAFT', 'RFQ_SENT', 'VENDOR_SELECTED', 'CLOSED', 'CANCELED')),
    CONSTRAINT chk_purchase_request_item_type CHECK (
        (dtype = 'SERVICE' AND service_category_id IS NOT NULL AND material_id IS NULL) OR
        (dtype = 'MATERIAL' AND service_category_id IS NULL AND material_id IS NOT NULL)
    )
);

CREATE INDEX idx_purchase_requests_dtype ON purchase_requests (dtype);
CREATE INDEX idx_purchase_requests_project ON purchase_requests (project_id);
CREATE INDEX idx_purchase_requests_service_category ON purchase_requests (service_category_id);
CREATE INDEX idx_purchase_requests_material ON purchase_requests (material_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests (status);
CREATE INDEX idx_purchase_requests_created_by ON purchase_requests (created_by_id);
CREATE INDEX idx_purchase_requests_required_date ON purchase_requests (required_date);

-- =====================================================================
-- RFQ ITEMS
-- =====================================================================

CREATE TABLE rfq_items
(
    id                  BIGSERIAL PRIMARY KEY,
    purchase_request_id BIGINT         NOT NULL REFERENCES purchase_requests (id) ON DELETE CASCADE,
    vendor_company_id   BIGINT         NOT NULL REFERENCES companies (id) ON DELETE RESTRICT,
    vendor_offering_id  BIGINT REFERENCES vendor_service_offerings (id) ON DELETE SET NULL,
    status              VARCHAR(20)    NOT NULL DEFAULT 'SENT',
    quoted_price        DECIMAL(15, 2),
    quoted_lead_time    INTEGER,
    notes               TEXT,
    sent_at             TIMESTAMP,
    replied_at          TIMESTAMP,
    created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rfq_status CHECK (status IN ('SENT', 'REPLIED', 'NO_RESPONSE', 'SELECTED', 'REJECTED')),
    CONSTRAINT chk_rfq_quoted_price_positive CHECK (quoted_price IS NULL OR quoted_price >= 0),
    CONSTRAINT chk_rfq_lead_time_positive CHECK (quoted_lead_time IS NULL OR quoted_lead_time >= 0)
);

CREATE INDEX idx_rfq_items_purchase_request ON rfq_items (purchase_request_id);
CREATE INDEX idx_rfq_items_vendor ON rfq_items (vendor_company_id);
CREATE INDEX idx_rfq_items_status ON rfq_items (status);
CREATE INDEX idx_rfq_items_vendor_offering ON rfq_items (vendor_offering_id);

CREATE UNIQUE INDEX idx_rfq_items_one_selected
    ON rfq_items (purchase_request_id)
    WHERE status = 'SELECTED';

-- =====================================================================
-- PURCHASE ORDERS
-- =====================================================================

CREATE TABLE purchase_orders
(
    id                     BIGSERIAL PRIMARY KEY,
    rfq_item_id            BIGINT         NOT NULL REFERENCES rfq_items (id) ON DELETE RESTRICT,
    project_id             BIGINT REFERENCES projects (id) ON DELETE SET NULL,
    vendor_company_id      BIGINT         NOT NULL REFERENCES companies (id) ON DELETE RESTRICT,
    po_number              VARCHAR(50)    NOT NULL UNIQUE,
    order_date             DATE           NOT NULL,
    expected_delivery_date DATE           NOT NULL,
    total_amount           DECIMAL(15, 2) NOT NULL,
    currency               VARCHAR(3)              DEFAULT 'KRW',
    status                 VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',
    notes                  TEXT,
    created_by_id          BIGINT         NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at             TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_po_total_positive CHECK (total_amount >= 0),
    CONSTRAINT chk_po_delivery_after_order CHECK (expected_delivery_date >= order_date),
    CONSTRAINT chk_po_status CHECK (status IN ('DRAFT', 'SENT', 'CONFIRMED', 'RECEIVED', 'CANCELED'))
);

CREATE INDEX idx_purchase_orders_rfq_item ON purchase_orders (rfq_item_id);
CREATE INDEX idx_purchase_orders_project ON purchase_orders (project_id);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders (vendor_company_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders (status);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders (created_by_id);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders (order_date);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE material_categories IS 'Categories for purchased materials (e.g., Fasteners, Raw Materials, Tools)';
COMMENT ON TABLE materials IS 'Physical materials/items purchased from vendors';
COMMENT ON COLUMN materials.sku IS 'Stock Keeping Unit - unique identifier for the material';
COMMENT ON COLUMN materials.standard_price IS 'Reference price per unit (can be overridden per PO)';
COMMENT ON COLUMN materials.preferred_vendor_id IS 'Default vendor for this material';

COMMENT ON TABLE purchase_requests IS 'Internal request for purchasing materials or outsourcing services';
COMMENT ON COLUMN purchase_requests.dtype IS 'Discriminator column for JPA inheritance: SERVICE or MATERIAL';
COMMENT ON COLUMN purchase_requests.project_id IS 'Optional project reference (null for general purchases)';
COMMENT ON COLUMN purchase_requests.request_number IS 'Unique request ID: PR-YYYY-NNNNNN';
COMMENT ON COLUMN purchase_requests.status IS 'DRAFT → RFQ_SENT → VENDOR_SELECTED → CLOSED, or CANCELED';
COMMENT ON COLUMN purchase_requests.material_id IS 'Reference to material (only for dtype=MATERIAL)';

COMMENT ON TABLE rfq_items IS 'Individual RFQ sent to a specific vendor for a purchase request';
COMMENT ON COLUMN rfq_items.vendor_offering_id IS 'Reference to vendor catalog offering (optional)';
COMMENT ON COLUMN rfq_items.status IS 'SENT → REPLIED → SELECTED/REJECTED, or NO_RESPONSE';
COMMENT ON COLUMN rfq_items.quoted_price IS 'Vendor quoted price (required when status = REPLIED)';

COMMENT ON TABLE purchase_orders IS 'Official order to vendor based on selected RFQ response';
COMMENT ON COLUMN purchase_orders.po_number IS 'Unique PO ID: PO-YYYY-NNNNNN';
COMMENT ON COLUMN purchase_orders.status IS 'DRAFT → SENT → CONFIRMED → RECEIVED, or CANCELED';
