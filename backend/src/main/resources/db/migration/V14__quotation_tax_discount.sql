-- =====================================================================
-- V14: Add tax rate and discount amount to quotations and invoices
-- =====================================================================
-- This migration adds support for:
-- 1. Quotation: Configurable tax rate (default 10% Korean VAT) and discount amount
-- 2. TaxInvoice: Discount amount (proportional from quotation)
--
-- Calculation formulas:
--   Quotation:
--     subtotal = sum(line_items.line_total)
--     taxAmount = subtotal × taxRate / 100 (HALF_UP, 2 decimals)
--     amountBeforeDiscount = subtotal + taxAmount
--     finalAmount = amountBeforeDiscount - discountAmount
--
--   TaxInvoice (inherits from Quotation):
--     invoiceSubtotal = sum(invoice_line_items.line_total)
--     invoiceTaxAmount = invoiceSubtotal × quotation.taxRate / 100
--     discountRatio = invoiceSubtotal / quotation.subtotal
--     invoiceDiscount = quotation.discountAmount × discountRatio
--     invoiceFinalAmount = (invoiceSubtotal + invoiceTaxAmount) - invoiceDiscount
-- =====================================================================

-- Quotation: Add tax and discount fields
ALTER TABLE quotations
    ADD COLUMN tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
    ADD COLUMN discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.0;

ALTER TABLE quotations
    ADD CONSTRAINT chk_quotation_tax_rate_range CHECK (tax_rate >= 0 AND tax_rate <= 100),
    ADD CONSTRAINT chk_quotation_discount_non_negative CHECK (discount_amount >= 0);

COMMENT ON COLUMN quotations.tax_rate IS 'Tax rate percentage (0-100). Default 10% Korean VAT.';
COMMENT ON COLUMN quotations.discount_amount IS 'Fixed discount in KRW. Only editable in DRAFT.';

-- TaxInvoice: Add discount_amount field (proportional from quotation)
-- Note: taxRate already exists in tax_invoices, will be populated from quotation
ALTER TABLE tax_invoices
    ADD COLUMN discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.0;

ALTER TABLE tax_invoices
    ADD CONSTRAINT chk_invoice_discount_non_negative CHECK (discount_amount >= 0);

COMMENT ON COLUMN tax_invoices.discount_amount IS 'Proportional discount inherited from quotation.';
