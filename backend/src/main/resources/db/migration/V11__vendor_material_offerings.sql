-- ============================================================================
-- V11: Vendor Material Offerings
-- ============================================================================
-- Creates vendor_material_offerings table to map vendors to materials with pricing.
-- Enables "select material → get vendor/price list" functionality for RFQ.
-- ============================================================================

-- Create vendor_material_offerings table
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

-- Comments
COMMENT ON TABLE vendor_material_offerings IS 'Maps vendors to materials with pricing for RFQ';
COMMENT ON COLUMN vendor_material_offerings.vendor_material_code IS 'Vendor''s internal code for this material';
COMMENT ON COLUMN vendor_material_offerings.vendor_material_name IS 'Vendor''s name for this material';
COMMENT ON COLUMN vendor_material_offerings.effective_from IS 'Price effective start date (NULL = always effective)';
COMMENT ON COLUMN vendor_material_offerings.effective_to IS 'Price effective end date (NULL = no expiry)';
COMMENT ON COLUMN vendor_material_offerings.is_preferred IS 'Whether this is a preferred vendor for this material';
