-- V7: Invoice domain - TaxInvoice, InvoiceLineItem, and Payment tables
-- Supports tax invoice generation and payment tracking.

-- =====================================================================
-- TAX INVOICE TABLE
-- =====================================================================

CREATE TABLE tax_invoices (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    quotation_id BIGINT REFERENCES quotations(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    total_before_tax DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
    total_tax DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    notes TEXT,
    created_by_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    issued_to_customer_date DATE,
    CONSTRAINT fk_invoice_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT uq_invoice_number UNIQUE (invoice_number),
    CONSTRAINT chk_invoice_status CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    CONSTRAINT chk_invoice_amounts CHECK (total_before_tax >= 0 AND total_tax >= 0 AND total_amount >= 0),
    CONSTRAINT chk_invoice_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100),
    CONSTRAINT chk_invoice_due_date CHECK (due_date >= issue_date)
);

-- =====================================================================
-- INVOICE LINE ITEM TABLE
-- =====================================================================

CREATE TABLE invoice_line_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity_invoiced DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    line_total DECIMAL(15, 2) NOT NULL,
    CONSTRAINT fk_line_item_invoice FOREIGN KEY (invoice_id) REFERENCES tax_invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_line_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT uq_invoice_product UNIQUE (invoice_id, product_id),
    CONSTRAINT chk_line_item_quantity CHECK (quantity_invoiced > 0),
    CONSTRAINT chk_line_item_price CHECK (unit_price >= 0),
    CONSTRAINT chk_line_item_total CHECK (line_total >= 0)
);

-- =====================================================================
-- PAYMENT TABLE
-- =====================================================================

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    recorded_by_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES tax_invoices(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_recorder FOREIGN KEY (recorded_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'CASH', 'OTHER'))
);

-- =====================================================================
-- INVOICE NUMBER SEQUENCE
-- =====================================================================

CREATE SEQUENCE invoice_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_val BIGINT;
    year_str VARCHAR(4);
BEGIN
    next_val := nextval('invoice_number_seq');
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    RETURN 'INV-' || year_str || '-' || LPAD(next_val::VARCHAR, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- TRIGGER
-- =====================================================================

CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_updated_at
    BEFORE UPDATE ON tax_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_updated_at();

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_invoice_project ON tax_invoices(project_id);
CREATE INDEX idx_invoice_quotation ON tax_invoices(quotation_id);
CREATE INDEX idx_invoice_status ON tax_invoices(status);
CREATE INDEX idx_invoice_due_date ON tax_invoices(due_date);
CREATE INDEX idx_invoice_created_at ON tax_invoices(created_at);

CREATE INDEX idx_line_item_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_line_item_product ON invoice_line_items(product_id);

CREATE INDEX idx_payment_invoice ON payments(invoice_id);
CREATE INDEX idx_payment_date ON payments(payment_date);
CREATE INDEX idx_payment_recorded_by ON payments(recorded_by_id);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE tax_invoices IS 'Tax invoices (세금계산서) for customer billing';
COMMENT ON TABLE invoice_line_items IS 'Line items within a tax invoice';
COMMENT ON TABLE payments IS 'Payment records against invoices';

COMMENT ON COLUMN tax_invoices.status IS 'DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED';
COMMENT ON COLUMN tax_invoices.tax_rate IS 'VAT rate as percentage (default 10% for Korea)';
COMMENT ON COLUMN tax_invoices.quotation_id IS 'References the quotation version this invoice was created against';
COMMENT ON COLUMN payments.payment_method IS 'BANK_TRANSFER, CREDIT_CARD, CHECK, CASH, OTHER';
