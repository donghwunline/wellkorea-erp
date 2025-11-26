-- WellKorea ERP Delivery and Invoice Schema
-- Entities: Delivery, DeliveryLineItem, TaxInvoice, InvoiceLineItem, Payment

-- Deliveries table
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jobcode_id UUID NOT NULL REFERENCES jobcodes(id) ON DELETE RESTRICT,
    delivery_number INT NOT NULL,
    delivery_date DATE NOT NULL,
    is_final_delivery BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT chk_delivery_number CHECK (delivery_number > 0),
    UNIQUE (jobcode_id, delivery_number)
);

CREATE INDEX idx_deliveries_jobcode ON deliveries(jobcode_id);
CREATE INDEX idx_deliveries_date ON deliveries(delivery_date);

-- Delivery Line Items table
CREATE TABLE delivery_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_delivered DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    line_total DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_delivery_line_quantity CHECK (quantity_delivered > 0),
    CONSTRAINT chk_delivery_line_price CHECK (unit_price >= 0),
    CONSTRAINT chk_delivery_line_total CHECK (line_total >= 0)
);

CREATE INDEX idx_delivery_line_items_delivery ON delivery_line_items(delivery_id);
CREATE INDEX idx_delivery_line_items_product ON delivery_line_items(product_id);

-- Tax Invoices table (both sales and purchase)
CREATE TABLE tax_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_type VARCHAR(20) NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    jobcode_id UUID REFERENCES jobcodes(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL,
    due_date DATE,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    grand_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_invoice_type CHECK (invoice_type IN ('SALES', 'PURCHASE')),
    CONSTRAINT chk_invoice_status CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'))
);

CREATE INDEX idx_tax_invoices_type ON tax_invoices(invoice_type);
CREATE INDEX idx_tax_invoices_jobcode ON tax_invoices(jobcode_id);
CREATE INDEX idx_tax_invoices_customer ON tax_invoices(customer_id);
CREATE INDEX idx_tax_invoices_status ON tax_invoices(status);
CREATE INDEX idx_tax_invoices_date ON tax_invoices(invoice_date);
CREATE INDEX idx_tax_invoices_due_date ON tax_invoices(due_date);

-- Invoice Line Items table (tracks what's been invoiced to prevent double-billing)
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_invoice_id UUID NOT NULL REFERENCES tax_invoices(id) ON DELETE CASCADE,
    delivery_line_item_id UUID REFERENCES delivery_line_items(id),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    line_total DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_invoice_line_quantity CHECK (quantity > 0),
    CONSTRAINT chk_invoice_line_price CHECK (unit_price >= 0),
    CONSTRAINT chk_invoice_line_total CHECK (line_total >= 0)
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(tax_invoice_id);
CREATE INDEX idx_invoice_line_items_delivery ON invoice_line_items(delivery_line_item_id);
CREATE INDEX idx_invoice_line_items_product ON invoice_line_items(product_id);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_invoice_id UUID NOT NULL REFERENCES tax_invoices(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT chk_payment_amount CHECK (amount != 0)
);

CREATE INDEX idx_payments_invoice ON payments(tax_invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Triggers
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_line_items_updated_at BEFORE UPDATE ON delivery_line_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_invoices_updated_at BEFORE UPDATE ON tax_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_line_items_updated_at BEFORE UPDATE ON invoice_line_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate invoice total
CREATE OR REPLACE FUNCTION calculate_invoice_total(invoice_uuid UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
    total DECIMAL(15, 2);
BEGIN
    SELECT COALESCE(SUM(line_total), 0) INTO total
    FROM invoice_line_items
    WHERE tax_invoice_id = invoice_uuid;
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate remaining balance on invoice
CREATE OR REPLACE FUNCTION calculate_invoice_balance(invoice_uuid UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
    invoice_total DECIMAL(15, 2);
    paid_amount DECIMAL(15, 2);
BEGIN
    SELECT grand_total INTO invoice_total
    FROM tax_invoices
    WHERE id = invoice_uuid;

    SELECT COALESCE(SUM(amount), 0) INTO paid_amount
    FROM payments
    WHERE tax_invoice_id = invoice_uuid;

    RETURN invoice_total - paid_amount;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE deliveries IS 'Delivery records per jobcode with delivery number';
COMMENT ON TABLE delivery_line_items IS 'Products and quantities delivered';
COMMENT ON TABLE tax_invoices IS 'Sales and purchase tax invoices';
COMMENT ON TABLE invoice_line_items IS 'Invoice line items tracking what has been invoiced to prevent double-billing';
COMMENT ON TABLE payments IS 'Payment records for invoices (supports partial payments and refunds)';
COMMENT ON COLUMN payments.amount IS 'Payment amount (can be negative for refunds)';
