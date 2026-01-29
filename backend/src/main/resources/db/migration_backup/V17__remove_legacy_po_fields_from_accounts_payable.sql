-- Remove legacy PO fields from accounts_payable
-- Data has been migrated to cause_* fields in V16

ALTER TABLE accounts_payable DROP COLUMN purchase_order_id;
ALTER TABLE accounts_payable DROP COLUMN po_number;
