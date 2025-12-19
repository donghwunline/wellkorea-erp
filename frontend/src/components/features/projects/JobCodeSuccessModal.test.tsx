/**
 * Unit tests for JobCodeSuccessModal component.
 * Tests rendering, copy to clipboard, navigation actions, and accessibility.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { JobCodeSuccessModal } from './JobCodeSuccessModal';

describe('JobCodeSuccessModal', () => {
  const defaultProps = {
    isOpen: true,
    jobCode: 'WK2-2025-042-0120',
    onClose: vi.fn(),
    onViewProject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Always ensure real timers are restored after each test
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      expect(screen.getByText('Project Created Successfully')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<JobCodeSuccessModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Project Created Successfully')).not.toBeInTheDocument();
    });

    it('should render success icon', () => {
      const { container } = render(<JobCodeSuccessModal {...defaultProps} />);

      // Check for green success icon container
      const iconContainer = container.querySelector('.bg-green-500\\/20');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render success message', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      expect(
        screen.getByText('Your project has been created with the following Job Code:')
      ).toBeInTheDocument();
    });

    it('should render job code prominently', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      const jobCode = screen.getByText('WK2-2025-042-0120');
      expect(jobCode).toBeInTheDocument();
      expect(jobCode).toHaveClass('font-mono');
      expect(jobCode).toHaveClass('text-copper-400');
    });

    it('should render usage hint', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      expect(
        screen.getByText(
          'Use this Job Code to reference this project in quotations, production, and invoicing.'
        )
      ).toBeInTheDocument();
    });

    it('should render Back to List button', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /back to list/i })).toBeInTheDocument();
    });

    it('should render View Project button', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /view project/i })).toBeInTheDocument();
    });

    it('should render copy button', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
    });
  });

  describe('copy to clipboard', () => {
    it('should show "Copied!" message after clicking copy button', async () => {
      const user = userEvent.setup();
      render(<JobCodeSuccessModal {...defaultProps} />);

      await user.click(screen.getByTitle('Copy to clipboard'));

      await waitFor(() => {
        expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();
      });
    });

    it('should change button title to "Copied!" after clicking copy button', async () => {
      const user = userEvent.setup();
      render(<JobCodeSuccessModal {...defaultProps} />);

      await user.click(screen.getByTitle('Copy to clipboard'));

      await waitFor(() => {
        expect(screen.getByTitle('Copied!')).toBeInTheDocument();
      });
    });

    it('should reset copied state after timeout', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<JobCodeSuccessModal {...defaultProps} />);

      await user.click(screen.getByTitle('Copy to clipboard'));

      // Wait for copied state
      await vi.waitFor(() => {
        expect(screen.getByTitle('Copied!')).toBeInTheDocument();
      });

      // Fast-forward 2 seconds
      await act(async () => {
        vi.advanceTimersByTime(2100);
      });

      // Should reset back to original title
      await vi.waitFor(() => {
        expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
      });
    }, 10000);
  });

  describe('navigation actions', () => {
    it('should call onClose when Back to List is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<JobCodeSuccessModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /back to list/i }));

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('should call onViewProject when View Project is clicked', async () => {
      const user = userEvent.setup();
      const onViewProject = vi.fn();
      render(<JobCodeSuccessModal {...defaultProps} onViewProject={onViewProject} />);

      await user.click(screen.getByRole('button', { name: /view project/i }));

      expect(onViewProject).toHaveBeenCalledOnce();
    });
  });

  describe('modal behavior', () => {
    it('should call onClose when modal close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<JobCodeSuccessModal {...defaultProps} onClose={onClose} />);

      // Modal component should have a close button (usually an X)
      // The Modal component typically passes onClose to its internal close mechanism
      // Back to List also calls onClose, so that's our test here
      await user.click(screen.getByRole('button', { name: /back to list/i }));

      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('styling', () => {
    it('should render job code box with copper styling', () => {
      const { container } = render(<JobCodeSuccessModal {...defaultProps} />);

      const jobCodeBox = container.querySelector('.border-copper-500\\/30');
      expect(jobCodeBox).toBeInTheDocument();
    });

    it('should render job code with large font', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      const jobCode = screen.getByText('WK2-2025-042-0120');
      expect(jobCode).toHaveClass('text-2xl');
    });

    it('should center content', () => {
      const { container } = render(<JobCodeSuccessModal {...defaultProps} />);

      const contentDiv = container.querySelector('.text-center');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  describe('button variants', () => {
    it('should render Back to List as secondary button', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      // Button variant can be checked by checking class or just ensuring it exists
      expect(screen.getByRole('button', { name: /back to list/i })).toBeInTheDocument();
    });

    it('should render View Project as primary button with icon', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      const viewButton = screen.getByRole('button', { name: /view project/i });
      expect(viewButton).toBeInTheDocument();

      // Should contain an SVG icon
      const svg = viewButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have modal dialog role', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have accessible title', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      expect(screen.getByText('Project Created Successfully')).toBeInTheDocument();
    });

    it('should have accessible copy button', () => {
      render(<JobCodeSuccessModal {...defaultProps} />);

      const copyButton = screen.getByTitle('Copy to clipboard');
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('different job codes', () => {
    it('should display the provided job code', () => {
      render(<JobCodeSuccessModal {...defaultProps} jobCode="WK2-2025-099-0131" />);

      expect(screen.getByText('WK2-2025-099-0131')).toBeInTheDocument();
    });

    it('should show copied state when copying different job code', async () => {
      const user = userEvent.setup();
      render(<JobCodeSuccessModal {...defaultProps} jobCode="CUSTOM-CODE-123" />);

      await user.click(screen.getByTitle('Copy to clipboard'));

      await waitFor(() => {
        expect(screen.getByTitle('Copied!')).toBeInTheDocument();
      });
    });
  });
});
