-- Add composite index for vendor payment status queries
-- Improves performance for queries filtering by vendor_company_id and status

CREATE INDEX IF NOT EXISTS idx_accounts_payable_vendor_status
ON accounts_payable (vendor_company_id, status);
