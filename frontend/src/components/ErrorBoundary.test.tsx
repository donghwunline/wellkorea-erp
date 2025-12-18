/**
 * Tests for ErrorBoundary component
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

// Mock navigation utility
vi.mock('@/shared/utils', () => ({
  navigation: {
    reloadPage: vi.fn(),
  },
}));

const { navigation } = await import('@/shared/utils');

// Component that throws an error
const ProblemChild = () => {
  throw new Error('Test error: Boom!');
};

// Component that renders successfully
const GoodChild = () => <div>Success content</div>;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('error handling', () => {
    it('should catch errors and render fallback UI', () => {
      render(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should display error message in details element', () => {
      render(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>,
      );

      const errorDetails = screen.getByText(/Test error: Boom!/i);
      expect(errorDetails).toBeInTheDocument();

      // Should be in a <pre> tag
      expect(errorDetails.tagName).toBe('PRE');
    });

    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <GoodChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Success content')).toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('error recovery', () => {
    it('should have a Try Again button that resets error state', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>,
      );

      // Error should be shown
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Try Again button should exist and be clickable
      const tryAgainButton = screen.getByText('Try Again');
      expect(tryAgainButton).toBeInTheDocument();

      // Clicking should not throw
      await expect(user.click(tryAgainButton)).resolves.not.toThrow();
    });

    it('should call navigation.reloadPage when Reload Page button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>,
      );

      await user.click(screen.getByText('Reload Page'));

      expect(navigation.reloadPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('error details', () => {
    it('should have Error Details summary', () => {
      render(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>,
      );

      const summary = screen.getByText('Error Details');
      expect(summary).toBeInTheDocument();
      expect(summary.tagName).toBe('SUMMARY');
    });

    it('should show error message in details', () => {
      render(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/Test error: Boom!/i)).toBeInTheDocument();
    });
  });

  describe('UI elements', () => {
    it('should render both action buttons', () => {
      render(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('should render help text', () => {
      render(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText(/An unexpected error occurred/i, { exact: false }),
      ).toBeInTheDocument();
    });
  });

  describe('multiple errors', () => {
    it('should handle different error messages', () => {
      const AnotherErrorChild = () => {
        throw new Error('Another error message');
      };

      render(
        <ErrorBoundary>
          <AnotherErrorChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/Another error message/i)).toBeInTheDocument();
      expect(screen.queryByText(/Test error: Boom!/i)).not.toBeInTheDocument();
    });
  });
});
