/**
 * Unit tests for ProjectSummaryCard component.
 * Tests rendering, click navigation, and conditional display of section data.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ProjectSummaryCard } from './ProjectSummaryCard';
import type { ProjectSectionSummary } from '@/services';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Helper to create mock section summary
function createMockSectionSummary(
  overrides: Partial<ProjectSectionSummary> = {}
): ProjectSectionSummary {
  return {
    section: 'quotation',
    label: '견적/결재',
    totalCount: 5,
    pendingCount: 2,
    lastUpdated: '2025-01-15T10:30:00Z',
    ...overrides,
  };
}

describe('ProjectSummaryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date.now for consistent relative time testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderCard(
    projectId: number = 1,
    summary: ProjectSectionSummary = createMockSectionSummary()
  ) {
    return render(<ProjectSummaryCard projectId={projectId} summary={summary} />);
  }

  describe('basic rendering', () => {
    it('should render section label', () => {
      renderCard(1, createMockSectionSummary({ label: '견적/결재' }));

      expect(screen.getByText('견적/결재')).toBeInTheDocument();
    });

    it('should render total count', () => {
      renderCard(1, createMockSectionSummary({ totalCount: 10 }));

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should render section icon', () => {
      const { container } = renderCard(1, createMockSectionSummary({ section: 'quotation' }));

      // Check that an SVG icon is present
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('pending count display', () => {
    it('should display pending count when greater than 0', () => {
      renderCard(1, createMockSectionSummary({ pendingCount: 3 }));

      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not display pending section when pendingCount is 0', () => {
      renderCard(1, createMockSectionSummary({ pendingCount: 0 }));

      expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });
  });

  describe('progress bar display', () => {
    it('should display progress bar for process section', () => {
      renderCard(
        1,
        createMockSectionSummary({
          section: 'process',
          label: '공정/진행률',
          progressPercent: 60,
        })
      );

      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('should not display progress bar when progressPercent is undefined', () => {
      renderCard(1, createMockSectionSummary({ progressPercent: undefined }));

      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('should display green color for high progress (>=80%)', () => {
      const { container } = renderCard(
        1,
        createMockSectionSummary({
          section: 'process',
          progressPercent: 85,
        })
      );

      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('should display yellow color for medium progress (>=50%)', () => {
      const { container } = renderCard(
        1,
        createMockSectionSummary({
          section: 'process',
          progressPercent: 60,
        })
      );

      const progressBar = container.querySelector('.bg-yellow-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('should display copper color for low progress (<50%)', () => {
      const { container } = renderCard(
        1,
        createMockSectionSummary({
          section: 'process',
          progressPercent: 30,
        })
      );

      const progressBar = container.querySelector('.bg-copper-500');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('value display', () => {
    it('should display value when present', () => {
      renderCard(1, createMockSectionSummary({ value: 15000000 }));

      expect(screen.getByText('Value')).toBeInTheDocument();
      // Value should be formatted as Korean Won
      expect(screen.getByText('₩15,000,000')).toBeInTheDocument();
    });

    it('should not display value section when value is undefined', () => {
      renderCard(1, createMockSectionSummary({ value: undefined }));

      expect(screen.queryByText('Value')).not.toBeInTheDocument();
    });

    it('should format large values correctly', () => {
      renderCard(1, createMockSectionSummary({ value: 123456789 }));

      expect(screen.getByText('₩123,456,789')).toBeInTheDocument();
    });
  });

  describe('relative time display', () => {
    it('should display "Just now" for very recent updates', () => {
      renderCard(
        1,
        createMockSectionSummary({
          lastUpdated: '2025-01-15T11:59:30Z', // 30 seconds ago
        })
      );

      expect(screen.getByText(/Just now/)).toBeInTheDocument();
    });

    it('should display minutes ago for recent updates', () => {
      renderCard(
        1,
        createMockSectionSummary({
          lastUpdated: '2025-01-15T11:30:00Z', // 30 minutes ago
        })
      );

      expect(screen.getByText(/30m ago/)).toBeInTheDocument();
    });

    it('should display hours ago for updates within a day', () => {
      renderCard(
        1,
        createMockSectionSummary({
          lastUpdated: '2025-01-15T10:00:00Z', // 2 hours ago
        })
      );

      expect(screen.getByText(/2h ago/)).toBeInTheDocument();
    });

    it('should display days ago for updates within a week', () => {
      renderCard(
        1,
        createMockSectionSummary({
          lastUpdated: '2025-01-13T12:00:00Z', // 2 days ago
        })
      );

      expect(screen.getByText(/2d ago/)).toBeInTheDocument();
    });

    it('should display "Never" when lastUpdated is null', () => {
      renderCard(1, createMockSectionSummary({ lastUpdated: null }));

      expect(screen.getByText(/Never/)).toBeInTheDocument();
    });

    it('should display formatted date for older updates', () => {
      renderCard(
        1,
        createMockSectionSummary({
          lastUpdated: '2025-01-01T12:00:00Z', // 2 weeks ago
        })
      );

      // Should show Korean locale date format
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to section page on click', async () => {
      // Use real timers for click tests
      vi.useRealTimers();
      const user = userEvent.setup();

      const { container } = renderCard(
        123,
        createMockSectionSummary({
          section: 'quotation',
        })
      );

      // Card is an interactive div, not an article
      const card = container.firstChild as HTMLElement;
      await user.click(card);

      expect(mockNavigate).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/projects/123/quotation');
    });

    it('should navigate to correct section for each section type', async () => {
      // Use real timers for click tests
      vi.useRealTimers();
      const user = userEvent.setup();
      const sections: Array<{ section: ProjectSectionSummary['section']; path: string }> = [
        { section: 'quotation', path: '/projects/1/quotation' },
        { section: 'process', path: '/projects/1/process' },
        { section: 'outsource', path: '/projects/1/outsource' },
        { section: 'delivery', path: '/projects/1/delivery' },
        { section: 'documents', path: '/projects/1/documents' },
        { section: 'finance', path: '/projects/1/finance' },
      ];

      for (const { section, path } of sections) {
        vi.clearAllMocks();
        const { unmount, container } = renderCard(1, createMockSectionSummary({ section }));

        const card = container.firstChild as HTMLElement;
        await user.click(card);

        expect(mockNavigate).toHaveBeenCalledWith(path);
        unmount();
      }
    });
  });

  describe('section icons', () => {
    it('should render different icons for different sections', () => {
      const sections: ProjectSectionSummary['section'][] = [
        'quotation',
        'process',
        'outsource',
        'delivery',
        'documents',
        'finance',
      ];

      sections.forEach(section => {
        const { container, unmount } = renderCard(
          1,
          createMockSectionSummary({ section, label: section })
        );

        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('accessibility', () => {
    it('should be a clickable card element', () => {
      const { container } = renderCard();

      // Card uses interactive variant with cursor-pointer
      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
      expect(card.className).toContain('cursor-pointer');
    });

    it('should handle click events', async () => {
      // Use real timers for click tests
      vi.useRealTimers();
      const user = userEvent.setup();

      const { container } = renderCard(1, createMockSectionSummary({ section: 'quotation' }));

      const card = container.firstChild as HTMLElement;
      await user.click(card);

      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
