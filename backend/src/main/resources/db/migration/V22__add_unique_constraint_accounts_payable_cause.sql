-- V22: Add unique constraint on (cause_type, cause_id) for idempotent AP creation
-- Enables database-level protection against duplicate AP entries

-- Drop the existing non-unique index if it exists
DROP INDEX IF EXISTS idx_accounts_payable_cause;

-- Add unique constraint on (cause_type, cause_id)
-- This ensures only one AP entry exists per disbursement cause
ALTER TABLE accounts_payable
    ADD CONSTRAINT uq_accounts_payable_cause UNIQUE (cause_type, cause_id);

COMMENT ON CONSTRAINT uq_accounts_payable_cause ON accounts_payable IS
    'Ensures only one AP entry exists per disbursement cause';
