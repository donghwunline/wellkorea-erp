import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  let originalOverflow: string;

  beforeEach(() => {
    originalOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
  });

  describe('rendering', () => {
    it('should not render when closed', () => {
      render(<Modal isOpen={false} onClose={vi.fn()}>Content</Modal>);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(<Modal isOpen={true} onClose={vi.fn()}>Content</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <p>Modal content</p>
        </Modal>,
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>,
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should apply size classes', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()} size="sm">
          Small
        </Modal>,
      );
      expect(screen.getByRole('dialog')).toHaveClass('max-w-md');

      rerender(
        <Modal isOpen={true} onClose={vi.fn()} size="md">
          Medium
        </Modal>,
      );
      expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl');

      rerender(
        <Modal isOpen={true} onClose={vi.fn()} size="lg">
          Large
        </Modal>,
      );
      expect(screen.getByRole('dialog')).toHaveClass('max-w-4xl');
    });

    it('should apply custom className', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} className="custom-class">
          Content
        </Modal>,
      );
      expect(screen.getByRole('dialog')).toHaveClass('custom-class');
    });
  });

  describe('close functionality', () => {
    it('should show close button when title provided', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test">
          Content
        </Modal>,
      );
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test">
          Content
        </Modal>,
      );

      await user.click(screen.getByLabelText('Close dialog'));
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it('should call onClose when ESC pressed', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>,
      );

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it('should not close on ESC when closeOnEsc is false', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnEsc={false}>
          Content
        </Modal>,
      );

      await user.keyboard('{Escape}');
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have role="dialog"', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>,
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>,
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should link title with aria-labelledby', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title');
    });

    it('should lock body scroll when open', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>,
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>,
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={vi.fn()}>
          Content
        </Modal>,
      );
      expect(document.body.style.overflow).toBe(originalOverflow);
    });
  });

  describe('focus management', () => {
    it('should focus first focusable element when opened', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test">
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>,
      );

      // Close button (X) is the first focusable element in the title
      expect(document.activeElement).toBe(screen.getByLabelText('Close dialog'));
    });
  });
});
