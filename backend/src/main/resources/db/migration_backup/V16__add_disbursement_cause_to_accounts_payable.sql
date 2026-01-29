-- V16: Add disbursement cause abstraction to accounts_payable
-- Decouples AccountsPayable from PurchaseOrder to support multiple expenditure sources

-- Add new columns for disbursement cause
ALTER TABLE accounts_payable
    ADD COLUMN cause_type VARCHAR(30) DEFAULT 'PURCHASE_ORDER' NOT NULL,
    ADD COLUMN cause_id BIGINT,
    ADD COLUMN cause_reference_number VARCHAR(50);

-- Migrate existing data: populate cause_id and cause_reference_number from existing PO data
UPDATE accounts_payable
SET cause_id = purchase_order_id,
    cause_reference_number = po_number
WHERE purchase_order_id IS NOT NULL;

-- Create index for efficient cause-based lookups
CREATE INDEX idx_accounts_payable_cause ON accounts_payable(cause_type, cause_id);

-- Make purchase_order_id nullable to allow non-PO disbursement causes in the future
ALTER TABLE accounts_payable ALTER COLUMN purchase_order_id DROP NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN accounts_payable.cause_type IS 'Type of disbursement cause: PURCHASE_ORDER, EXPENSE_REPORT, SERVICE_CONTRACT, RECURRING_BILL, DIRECT_INVOICE';
COMMENT ON COLUMN accounts_payable.cause_id IS 'ID of the source entity that caused this payment obligation';
COMMENT ON COLUMN accounts_payable.cause_reference_number IS 'Human-readable reference number from the source document (e.g., PO number)';
