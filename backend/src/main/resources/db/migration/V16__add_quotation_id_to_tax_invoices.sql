-- =====================================================================
-- V16: Add quotation_id to tax_invoices table
-- =====================================================================
-- Invoices must be linked to a specific quotation (not just project)
-- for proper validation of invoiced quantities against quotation limits.
--
-- Business rule: Invoice qty <= delivered qty - already invoiced qty
-- The guard needs to query invoiced quantities per quotation,
-- which requires this foreign key.
--
-- Similar to how deliveries link to quotations (V13).
-- =====================================================================

-- Add quotation_id column (nullable initially for existing data)
ALTER TABLE tax_invoices
    ADD COLUMN IF NOT EXISTS quotation_id BIGINT REFERENCES quotations(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tax_invoices_quotation_id ON tax_invoices(quotation_id);

-- Add comment explaining the column
COMMENT ON COLUMN tax_invoices.quotation_id IS 'References the quotation version this invoice was created against';

-- Update existing invoices to set quotation_id from their delivery's quotation
-- (if they have a delivery_id and that delivery has a quotation_id)
UPDATE tax_invoices i
SET quotation_id = d.quotation_id
FROM deliveries d
WHERE i.delivery_id = d.id
  AND i.quotation_id IS NULL
  AND d.quotation_id IS NOT NULL;
