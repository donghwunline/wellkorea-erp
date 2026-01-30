-- V8: Purchasing domain - Materials, PurchaseRequest (with inheritance), RFQ, PurchaseOrder
-- Enables purchasing workflow with vendor RFQ and purchase order management.
-- Uses JPA SINGLE_TABLE inheritance for SERVICE and MATERIAL purchase requests.
-- Includes vendor_material_offerings (from V11) and service_pr_attachments (from V26+V27).

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
-- VENDOR MATERIAL OFFERINGS (from V11)
-- =====================================================================

CREATE TABLE vendor_material_offerings (
    id BIGSERIAL PRIMARY KEY,
    vendor_company_id BIGINT NOT NULL REFERENCES companies(id),
    material_id BIGINT NOT NULL REFERENCES materials(id),
    vendor_material_code VARCHAR(50),
    vendor_material_name VARCHAR(200),
    unit_price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'KRW',
    lead_time_days INTEGER,
    min_order_quantity INTEGER,
    effective_from DATE,
    effective_to DATE,
    is_preferred BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Business rule constraints (matching vendor_service_offerings pattern)
    CONSTRAINT chk_vmo_price_positive CHECK (unit_price IS NULL OR unit_price >= 0),
    CONSTRAINT chk_vmo_lead_time_positive CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
    CONSTRAINT chk_vmo_min_order_positive CHECK (min_order_quantity IS NULL OR min_order_quantity >= 1),
    CONSTRAINT chk_vmo_effective_dates CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

-- Indexes for efficient queries
CREATE INDEX idx_vendor_material_offerings_material_id ON vendor_material_offerings(material_id);
CREATE INDEX idx_vendor_material_offerings_vendor_id ON vendor_material_offerings(vendor_company_id);
CREATE INDEX idx_vendor_material_offerings_effective ON vendor_material_offerings(effective_from, effective_to);

-- Conditional unique indexes: one offering per vendor-material-effective_from combination
-- Uses partial indexes to properly handle NULL effective_from values
CREATE UNIQUE INDEX idx_vendor_material_offering_unique
    ON vendor_material_offerings (vendor_company_id, material_id, effective_from)
    WHERE effective_from IS NOT NULL;

-- Ensure only one "always effective" entry (NULL effective_from) per vendor-material pair
CREATE UNIQUE INDEX idx_vendor_material_offering_null_effective
    ON vendor_material_offerings (vendor_company_id, material_id)
    WHERE effective_from IS NULL;

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
    CONSTRAINT chk_pr_status CHECK (status IN ('DRAFT', 'RFQ_SENT', 'VENDOR_SELECTED', 'ORDERED', 'CLOSED', 'CANCELED')),
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
-- RFQ ITEMS (ElementCollection table for PurchaseRequest aggregate)
-- =====================================================================

CREATE TABLE rfq_items
(
    purchase_request_id BIGINT         NOT NULL REFERENCES purchase_requests (id) ON DELETE CASCADE,
    item_id             VARCHAR(36)    NOT NULL,
    vendor_company_id   BIGINT         NOT NULL,
    vendor_offering_id  BIGINT,
    status              VARCHAR(20)    NOT NULL DEFAULT 'SENT',
    quoted_price        DECIMAL(15, 2),
    quoted_lead_time    INTEGER,
    notes               TEXT,
    sent_at             TIMESTAMP,
    replied_at          TIMESTAMP,
    CONSTRAINT pk_rfq_items PRIMARY KEY (purchase_request_id, item_id),
    CONSTRAINT chk_rfq_status CHECK (status IN ('SENT', 'REPLIED', 'NO_RESPONSE', 'SELECTED', 'REJECTED')),
    CONSTRAINT chk_rfq_quoted_price_positive CHECK (quoted_price IS NULL OR quoted_price >= 0),
    CONSTRAINT chk_rfq_lead_time_positive CHECK (quoted_lead_time IS NULL OR quoted_lead_time >= 0)
);

CREATE INDEX idx_rfq_items_vendor ON rfq_items (vendor_company_id);
CREATE INDEX idx_rfq_items_status ON rfq_items (status);

CREATE UNIQUE INDEX idx_rfq_items_one_selected
    ON rfq_items (purchase_request_id)
    WHERE status = 'SELECTED';

-- =====================================================================
-- PURCHASE ORDERS
-- =====================================================================

CREATE TABLE purchase_orders
(
    id                     BIGSERIAL PRIMARY KEY,
    purchase_request_id    BIGINT         NOT NULL REFERENCES purchase_requests (id) ON DELETE RESTRICT,
    rfq_item_id            VARCHAR(36)    NOT NULL,
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

CREATE INDEX idx_purchase_orders_purchase_request ON purchase_orders (purchase_request_id);
CREATE INDEX idx_purchase_orders_rfq_item ON purchase_orders (purchase_request_id, rfq_item_id);
CREATE INDEX idx_purchase_orders_project ON purchase_orders (project_id);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders (vendor_company_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders (status);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders (created_by_id);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders (order_date);

-- =====================================================================
-- SERVICE PURCHASE REQUEST ATTACHMENTS (from V26 + V27)
-- =====================================================================

CREATE TABLE service_pr_attachments (
    purchase_request_id     BIGINT NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    reference_id            VARCHAR(36) NOT NULL,
    file_name               VARCHAR(255) NOT NULL,
    file_type               VARCHAR(10) NOT NULL,
    file_size               BIGINT NOT NULL,
    storage_path            VARCHAR(500) NOT NULL,
    linked_by_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    linked_at               TIMESTAMP NOT NULL,

    PRIMARY KEY (purchase_request_id, reference_id),
    -- Prevent linking same file twice to same PR
    CONSTRAINT uq_service_pr_attachment_path UNIQUE (purchase_request_id, storage_path),
    -- Only allow supported file types
    CONSTRAINT chk_attachment_file_type CHECK (file_type IN ('PDF', 'DXF', 'DWG', 'JPG', 'PNG'))
);

-- Index for looking up attachments by purchase request
CREATE INDEX idx_service_pr_attachments_pr ON service_pr_attachments(purchase_request_id);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE material_categories IS 'Categories for purchased materials (e.g., Fasteners, Raw Materials, Tools)';
COMMENT ON TABLE materials IS 'Physical materials/items purchased from vendors';
COMMENT ON COLUMN materials.sku IS 'Stock Keeping Unit - unique identifier for the material';
COMMENT ON COLUMN materials.standard_price IS 'Reference price per unit (can be overridden per PO)';
COMMENT ON COLUMN materials.preferred_vendor_id IS 'Default vendor for this material';

COMMENT ON TABLE vendor_material_offerings IS 'Maps vendors to materials with pricing for RFQ';
COMMENT ON COLUMN vendor_material_offerings.vendor_material_code IS 'Vendor''s internal code for this material';
COMMENT ON COLUMN vendor_material_offerings.vendor_material_name IS 'Vendor''s name for this material';
COMMENT ON COLUMN vendor_material_offerings.effective_from IS 'Price effective start date (NULL = always effective)';
COMMENT ON COLUMN vendor_material_offerings.effective_to IS 'Price effective end date (NULL = no expiry)';
COMMENT ON COLUMN vendor_material_offerings.is_preferred IS 'Whether this is a preferred vendor for this material';

COMMENT ON TABLE purchase_requests IS 'Internal request for purchasing materials or outsourcing services';
COMMENT ON COLUMN purchase_requests.dtype IS 'Discriminator column for JPA inheritance: SERVICE or MATERIAL';
COMMENT ON COLUMN purchase_requests.project_id IS 'Optional project reference (null for general purchases)';
COMMENT ON COLUMN purchase_requests.request_number IS 'Unique request ID: PR-YYYY-NNNNNN';
COMMENT ON COLUMN purchase_requests.status IS 'DRAFT → RFQ_SENT → VENDOR_SELECTED → CLOSED, or CANCELED';
COMMENT ON COLUMN purchase_requests.material_id IS 'Reference to material (only for dtype=MATERIAL)';

COMMENT ON TABLE rfq_items IS 'Individual RFQ sent to a specific vendor (embedded in PurchaseRequest aggregate)';
COMMENT ON COLUMN rfq_items.item_id IS 'UUID identifier for the RFQ item within the purchase request';
COMMENT ON COLUMN rfq_items.vendor_company_id IS 'Reference to vendor company (Long ID, not FK for embeddable)';
COMMENT ON COLUMN rfq_items.vendor_offering_id IS 'Reference to vendor catalog offering (optional, Long ID)';
COMMENT ON COLUMN rfq_items.status IS 'SENT → REPLIED → SELECTED/REJECTED, or NO_RESPONSE';
COMMENT ON COLUMN rfq_items.quoted_price IS 'Vendor quoted price (required when status = REPLIED)';

COMMENT ON TABLE purchase_orders IS 'Official order to vendor based on selected RFQ response';
COMMENT ON COLUMN purchase_orders.purchase_request_id IS 'Reference to parent purchase request';
COMMENT ON COLUMN purchase_orders.rfq_item_id IS 'UUID reference to the selected RFQ item within purchase request';
COMMENT ON COLUMN purchase_orders.po_number IS 'Unique PO ID: PO-YYYY-NNNNNN';
COMMENT ON COLUMN purchase_orders.status IS 'DRAFT → SENT → CONFIRMED → RECEIVED, or CANCELED';

COMMENT ON TABLE service_pr_attachments IS 'Attachment references for ServicePurchaseRequest - links to existing files in MinIO';
COMMENT ON COLUMN service_pr_attachments.reference_id IS 'UUID identifying this attachment reference';
COMMENT ON COLUMN service_pr_attachments.storage_path IS 'MinIO storage path (from TaskFlow/BlueprintAttachment)';
COMMENT ON COLUMN service_pr_attachments.linked_by_id IS 'User who linked this attachment';
