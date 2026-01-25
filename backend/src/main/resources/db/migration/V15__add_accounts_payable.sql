-- V15: Add AccountsPayable and VendorPayment tables
-- Tracks payment obligations to vendors for finance personnel

-- Accounts Payable table - tracks amounts owed to vendors
CREATE TABLE accounts_payable (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL UNIQUE REFERENCES purchase_orders(id),
    vendor_company_id BIGINT NOT NULL REFERENCES companies(id),
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    po_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Vendor Payments table - records individual payments toward AP
CREATE TABLE vendor_payments (
    id BIGSERIAL PRIMARY KEY,
    accounts_payable_id BIGINT NOT NULL REFERENCES accounts_payable(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    recorded_by_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for accounts_payable
CREATE INDEX idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX idx_accounts_payable_vendor ON accounts_payable(vendor_company_id);
CREATE INDEX idx_accounts_payable_due_date ON accounts_payable(due_date);

-- Indexes for vendor_payments
CREATE INDEX idx_vendor_payments_ap_id ON vendor_payments(accounts_payable_id);

-- Comments
COMMENT ON TABLE accounts_payable IS 'Tracks payment obligations to vendors based on confirmed purchase orders';
COMMENT ON COLUMN accounts_payable.status IS 'PENDING, PARTIALLY_PAID, PAID, CANCELLED';
COMMENT ON COLUMN accounts_payable.due_date IS 'Optional payment due date, set manually';

COMMENT ON TABLE vendor_payments IS 'Records individual payments toward accounts payable entries';
COMMENT ON COLUMN vendor_payments.payment_method IS 'BANK_TRANSFER, CHECK, CASH, PROMISSORY_NOTE, OTHER';
