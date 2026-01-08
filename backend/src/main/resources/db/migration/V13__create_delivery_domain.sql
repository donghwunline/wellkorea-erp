-- V13__create_delivery_domain.sql
-- US5: Delivery Tracking - Delivery and DeliveryLineItem tables
-- Supports granular delivery tracking with double-invoicing prevention

-- Delivery status enum
-- Note: PostgreSQL doesn't have native ENUM, using VARCHAR with CHECK constraint
-- PENDING: Delivery scheduled but not yet completed
-- DELIVERED: Products have been delivered to customer
-- RETURNED: Products returned (for tracking refunds/corrections)

-- ============================================================================
-- Delivery Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS deliveries (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DELIVERED', 'RETURNED')),
    delivered_by_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comments for documentation
COMMENT ON TABLE deliveries IS 'Records when products are shipped to customer (US5)';
COMMENT ON COLUMN deliveries.project_id IS 'References the project (JobCode) this delivery belongs to';
COMMENT ON COLUMN deliveries.delivery_date IS 'Date of actual delivery';
COMMENT ON COLUMN deliveries.status IS 'Delivery status: PENDING, DELIVERED, RETURNED';
COMMENT ON COLUMN deliveries.delivered_by_id IS 'User who recorded/made the delivery';
COMMENT ON COLUMN deliveries.notes IS 'Optional delivery notes (e.g., partial shipment reason)';

-- ============================================================================
-- Delivery Line Item Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery_line_items (
    id BIGSERIAL PRIMARY KEY,
    delivery_id BIGINT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_delivered DECIMAL(10, 2) NOT NULL CHECK (quantity_delivered > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: Same product cannot appear twice in same delivery
ALTER TABLE delivery_line_items
    ADD CONSTRAINT uk_delivery_line_items_delivery_product
    UNIQUE (delivery_id, product_id);

-- Comments for documentation
COMMENT ON TABLE delivery_line_items IS 'Individual products delivered in a shipment (US5)';
COMMENT ON COLUMN delivery_line_items.delivery_id IS 'References the parent delivery';
COMMENT ON COLUMN delivery_line_items.product_id IS 'Product being delivered';
COMMENT ON COLUMN delivery_line_items.quantity_delivered IS 'How many units delivered (must be > 0)';

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
-- Query: Get all deliveries for a project (most common query)
CREATE INDEX IF NOT EXISTS idx_deliveries_project_id ON deliveries(project_id);

-- Query: Get deliveries by status
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- Query: Get deliveries by date range
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_date ON deliveries(delivery_date);

-- Query: Get deliveries by user who recorded them
CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_by ON deliveries(delivered_by_id);

-- Query: Get line items for a delivery
CREATE INDEX IF NOT EXISTS idx_delivery_line_items_delivery_id ON delivery_line_items(delivery_id);

-- Query: Get all deliveries containing a specific product
CREATE INDEX IF NOT EXISTS idx_delivery_line_items_product_id ON delivery_line_items(product_id);

-- ============================================================================
-- Helper View: Delivered Quantities per Project/Product
-- ============================================================================
-- This view helps calculate remaining deliverable quantities
-- Used by DeliveryService to prevent over-delivery
CREATE OR REPLACE VIEW v_delivered_quantities AS
SELECT
    d.project_id,
    dli.product_id,
    SUM(dli.quantity_delivered) AS total_delivered
FROM deliveries d
JOIN delivery_line_items dli ON d.id = dli.delivery_id
WHERE d.status != 'RETURNED'  -- Exclude returned deliveries
GROUP BY d.project_id, dli.product_id;

COMMENT ON VIEW v_delivered_quantities IS 'Aggregated delivered quantities per project/product for over-delivery prevention';

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_delivery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_delivery_updated_at();
