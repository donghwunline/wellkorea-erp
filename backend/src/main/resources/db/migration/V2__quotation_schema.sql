-- WellKorea ERP Quotation Schema
-- Entities: Quotation, QuotationLineItem, Approval

-- Quotations table
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jobcode_id UUID NOT NULL REFERENCES jobcodes(id) ON DELETE RESTRICT,
    quotation_number VARCHAR(50) UNIQUE,
    version INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'DRAFT',
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_quotation_status CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENT', 'ACCEPTED', 'SUPERSEDED'))
);

CREATE INDEX idx_quotations_jobcode_id ON quotations(jobcode_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_created_at ON quotations(created_at);
CREATE INDEX idx_quotations_deleted_at ON quotations(deleted_at);
CREATE INDEX idx_quotations_number_version ON quotations(quotation_number, version);

-- Quotation Line Items table
CREATE TABLE quotation_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    line_total DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    line_order INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quotation_line_quantity CHECK (quantity > 0),
    CONSTRAINT chk_quotation_line_price CHECK (unit_price >= 0),
    CONSTRAINT chk_quotation_line_total CHECK (line_total >= 0)
);

CREATE INDEX idx_quotation_line_items_quotation_id ON quotation_line_items(quotation_id);
CREATE INDEX idx_quotation_line_items_product_id ON quotation_line_items(product_id);

-- Approval records table
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    comments TEXT,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_approval_action CHECK (action IN ('SUBMITTED', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_approvals_quotation_id ON approvals(quotation_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_approvals_approved_at ON approvals(approved_at);

-- Trigger to update quotation updated_at
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotation_line_items_updated_at BEFORE UPDATE ON quotation_line_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate quotation total
CREATE OR REPLACE FUNCTION calculate_quotation_total(quotation_uuid UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
    total DECIMAL(15, 2);
BEGIN
    SELECT COALESCE(SUM(line_total), 0) INTO total
    FROM quotation_line_items
    WHERE quotation_id = quotation_uuid;
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE quotations IS 'Customer quotations with versioning and approval workflow';
COMMENT ON TABLE quotation_line_items IS 'Line items in quotation - products with quotation-specific prices';
COMMENT ON TABLE approvals IS 'Approval history for quotations with approver and comments';
COMMENT ON COLUMN quotations.version IS 'Version number for quotation revisions';
COMMENT ON COLUMN quotation_line_items.unit_price IS 'Quotation-specific price (may differ from catalog base price)';
