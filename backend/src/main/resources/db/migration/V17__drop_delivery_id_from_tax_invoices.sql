-- =====================================================================
-- V17: Drop delivery_id from tax_invoices table
-- =====================================================================
-- The delivery_id column is no longer needed because:
-- 1. Invoice validation now uses quotation_id (added in V16)
-- 2. delivery_id was only used for UI auto-population, which can work
--    by loading all deliveries for the quotation instead
-- 3. Simpler model: Invoice -> Quotation (not Invoice -> Delivery)
-- =====================================================================

-- Drop the foreign key constraint first
ALTER TABLE tax_invoices
    DROP CONSTRAINT IF EXISTS fk_invoice_delivery;

-- Drop the column
ALTER TABLE tax_invoices
    DROP COLUMN IF EXISTS delivery_id;
