/**
 * Unit tests for EmailNotificationModal component.
 * Tests modal rendering, button interactions, and loading states.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EmailNotificationModal } from './EmailNotificationModal';

describe('EmailNotificationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSend: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<EmailNotificationModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Send Email Notification')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<EmailNotificationModal {...defaultProps} />);

      expect(screen.getByText('Send Email Notification')).toBeInTheDocument();
    });

    it('should display quotation info when provided', () => {
      render(
        <EmailNotificationModal
          {...defaultProps}
          quotationInfo={{ jobCode: 'WK22025-000001', version: 2 }}
        />
      );

      expect(
        screen.getByText(/Send email notification for "WK22025-000001 v2" to the customer\?/)
      ).toBeInTheDocument();
    });

    it('should display generic message when no quotation info', () => {
      render(<EmailNotificationModal {...defaultProps} />);

      expect(screen.getByText('Send email notification to the customer?')).toBeInTheDocument();
    });

    it('should render helper text', () => {
      render(<EmailNotificationModal {...defaultProps} />);

      expect(
        screen.getByText('This will notify the customer that the quotation is available.')
      ).toBeInTheDocument();
    });

    it('should render Cancel and Send Email buttons', () => {
      render(<EmailNotificationModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Email' })).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('should call onSend when Send Email clicked', async () => {
      const onSend = vi.fn().mockResolvedValue(undefined);
      render(<EmailNotificationModal {...defaultProps} onSend={onSend} />);

      const sendButton = screen.getByRole('button', { name: 'Send Email' });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(onSend).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onClose when Cancel clicked', () => {
      const onClose = vi.fn();
      render(<EmailNotificationModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should disable buttons when loading', () => {
      render(<EmailNotificationModal {...defaultProps} isLoading />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByText('Sending...').closest('button')).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('should show spinner and "Sending..." text when loading', () => {
      render(<EmailNotificationModal {...defaultProps} isLoading />);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    it('should disable Cancel button when loading', () => {
      render(<EmailNotificationModal {...defaultProps} isLoading />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });

  describe('async behavior', () => {
    it('should handle async onSend correctly', async () => {
      let resolvePromise: () => void;
      const onSend = vi.fn().mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolvePromise = resolve;
          })
      );

      render(<EmailNotificationModal {...defaultProps} onSend={onSend} />);

      const sendButton = screen.getByRole('button', { name: 'Send Email' });
      fireEvent.click(sendButton);

      expect(onSend).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        resolvePromise!();
      });
    });

    it('should not close modal automatically after onSend (parent handles close)', async () => {
      const onSend = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();
      render(<EmailNotificationModal {...defaultProps} onSend={onSend} onClose={onClose} />);

      const sendButton = screen.getByRole('button', { name: 'Send Email' });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(onSend).toHaveBeenCalledTimes(1);
      });

      // Modal does not call onClose after onSend - parent is responsible for closing
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
