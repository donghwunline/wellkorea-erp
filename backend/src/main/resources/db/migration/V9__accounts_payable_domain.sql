-- V9: Accounts Payable domain - Final consolidated state
-- Tracks payment obligations to vendors for finance personnel.
-- Consolidated from V15-V17, V19, V21-V22 (removes purchase_order_id, adds cause abstraction).

-- =====================================================================
-- ACCOUNTS PAYABLE TABLE (Final State)
-- =====================================================================

-- accounts_payable - FINAL STATE (no purchase_order_id, uses cause abstraction)
CREATE TABLE accounts_payable (
    id                      BIGSERIAL PRIMARY KEY,
    vendor_company_id       BIGINT NOT NULL REFERENCES companies(id),
    total_amount            DECIMAL(15, 2) NOT NULL,
    currency                VARCHAR(3) NOT NULL DEFAULT 'KRW',
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date                DATE,
    notes                   TEXT,
    -- Cause abstraction (from V16, without purchase_order_id)
    cause_type              VARCHAR(30) DEFAULT 'PURCHASE_ORDER' NOT NULL,
    cause_id                BIGINT,
    cause_reference_number  VARCHAR(50),
    -- Version for optimistic locking (from V19)
    version                 BIGINT NOT NULL DEFAULT 0,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- Unique constraint (from V22)
    CONSTRAINT uq_accounts_payable_cause UNIQUE (cause_type, cause_id)
);

-- =====================================================================
-- VENDOR PAYMENTS TABLE
-- =====================================================================

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

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX idx_accounts_payable_vendor ON accounts_payable(vendor_company_id);
CREATE INDEX idx_accounts_payable_due_date ON accounts_payable(due_date);
-- Composite index for vendor payment status queries (from V21)
CREATE INDEX idx_accounts_payable_vendor_status ON accounts_payable(vendor_company_id, status);

CREATE INDEX idx_vendor_payments_ap_id ON vendor_payments(accounts_payable_id);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE accounts_payable IS 'Tracks payment obligations to vendors based on various disbursement causes';
COMMENT ON COLUMN accounts_payable.status IS 'PENDING, PARTIALLY_PAID, PAID, CANCELLED';
COMMENT ON COLUMN accounts_payable.due_date IS 'Optional payment due date, set manually';
COMMENT ON COLUMN accounts_payable.cause_type IS 'Type of disbursement cause: PURCHASE_ORDER, EXPENSE_REPORT, SERVICE_CONTRACT, RECURRING_BILL, DIRECT_INVOICE';
COMMENT ON COLUMN accounts_payable.cause_id IS 'ID of the source entity that caused this payment obligation';
COMMENT ON COLUMN accounts_payable.cause_reference_number IS 'Human-readable reference number from the source document (e.g., PO number)';
COMMENT ON COLUMN accounts_payable.version IS 'Optimistic lock version for concurrent payment processing';
COMMENT ON CONSTRAINT uq_accounts_payable_cause ON accounts_payable IS 'Ensures only one AP entry exists per disbursement cause';

COMMENT ON TABLE vendor_payments IS 'Records individual payments toward accounts payable entries';
COMMENT ON COLUMN vendor_payments.payment_method IS 'BANK_TRANSFER, CHECK, CASH, PROMISSORY_NOTE, OTHER';
