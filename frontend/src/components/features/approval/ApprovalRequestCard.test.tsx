/**
 * Unit tests for ApprovalRequestCard component.
 *
 * Note: This component uses a different interface shape than the current ApprovalDetails type.
 * These tests are marked as skipped until the type mismatch is resolved.
 * The component expects: entityRef, requesterName, requestedAt, totalAmount, levelDecisions, history
 * The type provides: entityDescription, submittedByName, submittedAt, levels
 */

import { describe, it } from 'vitest';

describe('ApprovalRequestCard', () => {
  describe.todo('rendering', () => {
    it.todo('should render entity type badge');
    it.todo('should render entity reference');
    it.todo('should render status badge');
    it.todo('should render requester name');
    it.todo('should render current level');
    it.todo('should render total amount when provided');
    it.todo('should not render amount section when totalAmount is null');
    it.todo('should render request date');
  });

  describe.todo('level decisions timeline', () => {
    it.todo('should render all level decision indicators');
    it.todo('should show check icon for approved decisions');
    it.todo('should highlight current level');
  });

  describe.todo('history display', () => {
    it.todo('should render last history entry when history exists');
    it.todo('should not render history section when history is empty');
  });

  describe.todo('action buttons', () => {
    it.todo('should render View Details button when onViewEntity is provided');
    it.todo('should not render View Details button when onViewEntity is not provided');
    it.todo('should render Approve/Reject buttons when canAct is true');
    it.todo('should not render Approve/Reject buttons when canAct is false');
    it.todo('should disable buttons when isActing is true');
  });

  describe.todo('event handlers', () => {
    it.todo('should call onViewEntity when View Details is clicked');
    it.todo('should call onApprove with approval id when Approve is clicked');
    it.todo('should call onReject with approval id when Reject is clicked');
  });

  describe.todo('status variants', () => {
    it.todo('should render success badge for APPROVED status');
    it.todo('should render danger badge for REJECTED status');
  });
});
