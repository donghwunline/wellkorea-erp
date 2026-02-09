-- V16: Move invoice discount to Payment entity
-- Discount is now tracked as a Payment with method='DISCOUNT'

-- 1. Add DISCOUNT to payment_method CHECK constraint
ALTER TABLE payments
    DROP CONSTRAINT chk_payment_method;
ALTER TABLE payments
    ADD CONSTRAINT chk_payment_method
        CHECK (payment_method IN ('BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'CASH', 'OTHER', 'DISCOUNT'));

-- 2. Convert existing discount_amount to DISCOUNT payments
INSERT INTO payments (invoice_id, payment_date, amount, payment_method, reference_number, notes, recorded_by_id)
SELECT i.id,
       i.issue_date,
       i.discount_amount,
       'DISCOUNT',
       NULL,
       'Migrated from invoice discount field',
       i.created_by_id
FROM tax_invoices i
WHERE i.discount_amount > 0;

-- 3. Update totalAmount to gross (add back discount that was previously subtracted)
UPDATE tax_invoices
SET total_amount = total_amount + discount_amount
WHERE discount_amount > 0;

-- 4. Drop discount_amount column
ALTER TABLE tax_invoices
    DROP CONSTRAINT chk_invoice_discount_non_negative;
ALTER TABLE tax_invoices
    DROP COLUMN discount_amount;
