-- V19: Add version column for optimistic locking to accounts_payable
-- Prevents race conditions during concurrent payment processing

ALTER TABLE accounts_payable
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN accounts_payable.version IS 'Optimistic lock version for concurrent payment processing';
