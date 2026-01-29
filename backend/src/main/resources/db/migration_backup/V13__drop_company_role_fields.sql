-- V13: Drop unused fields from company_roles table
-- Remove credit_limit, default_payment_days, and notes columns as they are no longer needed.
-- Financial terms are now managed at the company level via payment_terms field.

ALTER TABLE company_roles DROP COLUMN IF EXISTS credit_limit;
ALTER TABLE company_roles DROP COLUMN IF EXISTS default_payment_days;
ALTER TABLE company_roles DROP COLUMN IF EXISTS notes;
