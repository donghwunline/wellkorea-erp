-- WellKorea ERP Cross-Cutting Schema
-- Entities: Document, Supplier, RFQ, PurchaseOrder

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    site_location VARCHAR(255),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    service_categories TEXT[],
    billing_address TEXT,
    payment_terms VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_suppliers_company_name ON suppliers(company_name);
CREATE INDEX idx_suppliers_active ON suppliers(active);
CREATE INDEX idx_suppliers_service_categories ON suppliers USING GIN(service_categories);

-- Documents table (polymorphic storage for all document types)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    storage_path VARCHAR(500) NOT NULL,
    document_type VARCHAR(50),
    owner_type VARCHAR(50),
    owner_id UUID,
    jobcode_id UUID REFERENCES jobcodes(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    version INT DEFAULT 1,
    is_archived BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_document_file_size CHECK (file_size > 0 AND file_size <= 104857600),
    CONSTRAINT chk_document_type CHECK (document_type IN ('DRAWING', 'QUOTATION', 'PHOTO', 'BOM', 'SPECIFICATION', 'INVOICE', 'PURCHASE_ORDER', 'OTHER'))
);

CREATE INDEX idx_documents_owner ON documents(owner_type, owner_id);
CREATE INDEX idx_documents_jobcode ON documents(jobcode_id);
CREATE INDEX idx_documents_product ON documents(product_id);
CREATE INDEX idx_documents_customer ON documents(customer_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at);
CREATE INDEX idx_documents_archived ON documents(is_archived);

-- RFQ (Request for Quotation) table
CREATE TABLE rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_number VARCHAR(50) UNIQUE NOT NULL,
    jobcode_id UUID REFERENCES jobcodes(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    required_delivery_date DATE,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT chk_rfq_status CHECK (status IN ('DRAFT', 'SENT', 'RESPONDED', 'NO_RESPONSE', 'CLOSED'))
);

CREATE INDEX idx_rfqs_jobcode ON rfqs(jobcode_id);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_category ON rfqs(category);

-- RFQ Vendor Responses table (many-to-many with responses)
CREATE TABLE rfq_vendor_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE,
    response_status VARCHAR(50) DEFAULT 'PENDING',
    quoted_price DECIMAL(15, 2),
    quoted_delivery_date DATE,
    notes TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rfq_response_status CHECK (response_status IN ('PENDING', 'RESPONDED', 'NO_RESPONSE', 'REJECTED', 'ACCEPTED'))
);

CREATE INDEX idx_rfq_responses_rfq ON rfq_vendor_responses(rfq_id);
CREATE INDEX idx_rfq_responses_supplier ON rfq_vendor_responses(supplier_id);

-- Purchase Orders table
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL,
    jobcode_id UUID REFERENCES jobcodes(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    item_description TEXT NOT NULL,
    quantity DECIMAL(10, 2),
    unit_price DECIMAL(15, 2),
    total_amount DECIMAL(15, 2) NOT NULL,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'ORDERED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT chk_po_status CHECK (status IN ('ORDERED', 'CONFIRMED', 'PARTIAL_RECEIVED', 'RECEIVED', 'INVOICED', 'CANCELLED'))
);

CREATE INDEX idx_purchase_orders_rfq ON purchase_orders(rfq_id);
CREATE INDEX idx_purchase_orders_jobcode ON purchase_orders(jobcode_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

-- Triggers
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON rfqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfq_responses_updated_at BEFORE UPDATE ON rfq_vendor_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate RFQ number
CREATE OR REPLACE FUNCTION generate_rfq_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_seq INT;
    rfq_num VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(rfq_number FROM 'RFQ-([0-9]+)') AS INT)), 0) + 1
    INTO next_seq
    FROM rfqs;

    rfq_num := 'RFQ-' || LPAD(next_seq::TEXT, 6, '0');
    RETURN rfq_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_seq INT;
    po_num VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 'PO-([0-9]+)') AS INT)), 0) + 1
    INTO next_seq
    FROM purchase_orders;

    po_num := 'PO-' || LPAD(next_seq::TEXT, 6, '0');
    RETURN po_num;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE suppliers IS 'Vendor/supplier companies with service categories';
COMMENT ON TABLE documents IS 'Central document storage with polymorphic ownership';
COMMENT ON TABLE rfqs IS 'Request for Quotation records';
COMMENT ON TABLE rfq_vendor_responses IS 'Vendor responses to RFQs';
COMMENT ON TABLE purchase_orders IS 'Purchase orders linked to jobcodes for cost tracking';
COMMENT ON COLUMN documents.owner_type IS 'Polymorphic owner type (JobCode, Quotation, TaxInvoice, etc.)';
COMMENT ON COLUMN documents.owner_id IS 'Polymorphic owner ID';
COMMENT ON COLUMN suppliers.service_categories IS 'Array of service categories (machining, etching, painting, etc.)';
