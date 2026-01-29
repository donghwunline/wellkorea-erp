-- =====================================================
-- V27: Add FK constraint to service_pr_attachments
-- =====================================================
-- Adds missing foreign key constraint on linked_by_id
-- which references the user who linked the attachment.
-- ON DELETE RESTRICT: Users should be deactivated, not deleted.
-- Consistent with other user references (purchase_orders.created_by_id, etc.)
-- =====================================================

ALTER TABLE service_pr_attachments
    ADD CONSTRAINT fk_service_pr_attachments_linked_by
    FOREIGN KEY (linked_by_id) REFERENCES users(id) ON DELETE RESTRICT;
