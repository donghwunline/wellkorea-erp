-- Add optimistic locking version column to approval_requests table
-- This prevents concurrent approval bypass when two approvers submit simultaneously

ALTER TABLE approval_requests
ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
