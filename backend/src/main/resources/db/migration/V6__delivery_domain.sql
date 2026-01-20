-- V6: Delivery domain - Delivery and DeliveryLineItem tables
-- Supports granular delivery tracking with double-invoicing prevention.

-- =====================================================================
-- DELIVERY TABLES
-- =====================================================================

CREATE TABLE deliveries (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    quotation_id BIGINT REFERENCES quotations(id) ON DELETE SET NULL,
    delivery_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DELIVERED', 'RETURNED')),
    delivered_by_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE delivery_line_items (
    id BIGSERIAL PRIMARY KEY,
    delivery_id BIGINT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_delivered DECIMAL(10, 2) NOT NULL CHECK (quantity_delivered > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_delivery_line_items_delivery_product UNIQUE (delivery_id, product_id)
);

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_deliveries_project_id ON deliveries(project_id);
CREATE INDEX idx_deliveries_quotation_id ON deliveries(quotation_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_delivery_date ON deliveries(delivery_date);
CREATE INDEX idx_deliveries_delivered_by ON deliveries(delivered_by_id);

CREATE INDEX idx_delivery_line_items_delivery_id ON delivery_line_items(delivery_id);
CREATE INDEX idx_delivery_line_items_product_id ON delivery_line_items(product_id);

-- =====================================================================
-- HELPER VIEW
-- =====================================================================

CREATE OR REPLACE VIEW v_delivered_quantities AS
SELECT
    d.project_id,
    d.quotation_id,
    dli.product_id,
    SUM(dli.quantity_delivered) AS total_delivered
FROM deliveries d
JOIN delivery_line_items dli ON d.id = dli.delivery_id
WHERE d.status != 'RETURNED'
GROUP BY d.project_id, d.quotation_id, dli.product_id;

-- =====================================================================
-- TRIGGER
-- =====================================================================

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

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE deliveries IS 'Records when products are shipped to customer';
COMMENT ON COLUMN deliveries.project_id IS 'References the project (JobCode) this delivery belongs to';
COMMENT ON COLUMN deliveries.quotation_id IS 'References the quotation version this delivery was recorded against';
COMMENT ON COLUMN deliveries.status IS 'Delivery status: PENDING, DELIVERED, RETURNED';

COMMENT ON TABLE delivery_line_items IS 'Individual products delivered in a shipment';
COMMENT ON COLUMN delivery_line_items.quantity_delivered IS 'How many units delivered (must be > 0)';

COMMENT ON VIEW v_delivered_quantities IS 'Aggregated delivered quantities per project/quotation/product for over-delivery prevention';
