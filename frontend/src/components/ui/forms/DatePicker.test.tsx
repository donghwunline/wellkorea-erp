/**
 * Unit tests for DatePicker component.
 * Tests rendering, user interactions, keyboard navigation, accessibility, and edge cases.
 */

import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DatePicker, type DateRange } from './DatePicker';

describe('DatePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to ensure consistent testing (January 15, 2025)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render with label', () => {
      render(<DatePicker label="Due Date" value="" onChange={vi.fn()} />);

      expect(screen.getByText('Due Date')).toBeInTheDocument();
    });

    it('should render required indicator when required', () => {
      render(<DatePicker label="Due Date" value="" onChange={vi.fn()} required />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render placeholder when no value', () => {
      render(<DatePicker value="" onChange={vi.fn()} placeholder="Select a date" />);

      expect(screen.getByText('Select a date')).toBeInTheDocument();
    });

    it('should render formatted date when value provided', () => {
      render(<DatePicker value="2025-01-15" onChange={vi.fn()} />);

      // Korean locale date format
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });

    it('should render error message when error provided', () => {
      render(<DatePicker value="" onChange={vi.fn()} error="Date is required" />);

      expect(screen.getByText('Date is required')).toBeInTheDocument();
    });

    it('should not render calendar dropdown initially', () => {
      render(<DatePicker value="" onChange={vi.fn()} />);

      // Calendar should not be visible initially
      expect(screen.queryByRole('button', { name: /previous month/i })).not.toBeInTheDocument();
    });
  });

  describe('dropdown interaction', () => {
    it('should open calendar when button is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<DatePicker value="" onChange={vi.fn()} />);

      // Click the trigger button
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Calendar should be visible now
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
    });

    it('should close calendar when clicking outside', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <DatePicker value="" onChange={vi.fn()} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      // Open calendar
      const trigger = container.querySelector('button')!;
      await user.click(trigger);
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByTestId('outside'));

      // Calendar should be closed
      expect(screen.queryByRole('button', { name: /previous month/i })).not.toBeInTheDocument();
    });

    it('should close calendar when Escape is pressed', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<DatePicker value="" onChange={vi.fn()} />);

      // Open calendar
      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();

      // Press Escape
      await user.keyboard('{Escape}');

      // Calendar should be closed
      expect(screen.queryByRole('button', { name: /previous month/i })).not.toBeInTheDocument();
    });
  });

  describe('date selection', () => {
    it('should call onChange when a date is selected', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const handleChange = vi.fn();
      // Provide a January date so calendar opens to January
      render(<DatePicker value="2025-01-01" onChange={handleChange} />);

      // Open calendar
      await user.click(screen.getByRole('button'));

      // Click on day 20
      const day20 = screen.getByRole('button', { name: '20' });
      await user.click(day20);

      expect(handleChange).toHaveBeenCalledWith('2025-01-20');
    });

    it('should close dropdown after selecting a date', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<DatePicker value="" onChange={vi.fn()} />);

      // Open calendar
      await user.click(screen.getByRole('button'));
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();

      // Select a date
      await user.click(screen.getByRole('button', { name: '15' }));

      // Calendar should be closed
      expect(screen.queryByRole('button', { name: /previous month/i })).not.toBeInTheDocument();
    });

    it('should highlight selected date', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<DatePicker value="2025-01-15" onChange={vi.fn()} />);

      // Open calendar
      await user.click(screen.getByRole('button'));

      // Find day 15 button and check it has selected styling
      const day15 = screen.getByRole('button', { name: '15' });
      expect(day15).toHaveClass('bg-copper-500');
    });
  });

  describe('month navigation', () => {
    it('should navigate to previous month when previous button clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<DatePicker value="2025-01-15" onChange={vi.fn()} />);

      // Open calendar
      await user.click(screen.getByRole('button'));

      // Initially should show January (month select is first combobox)
      const monthSelects = screen.getAllByRole('combobox');
      expect(monthSelects[0]).toHaveValue('0'); // January (0-indexed)

      // Click previous month
      await user.click(screen.getByRole('button', { name: /previous month/i }));

      // Should now show December (wrapped to previous year)
      const updatedMonthSelects = screen.getAllByRole('combobox');
      expect(updatedMonthSelects[0]).toHaveValue('11'); // December
    });

    it('should navigate to next month when next button clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<DatePicker value="2025-01-15" onChange={vi.fn()} />);

      // Open calendar
      await user.click(screen.getByRole('button'));

      // Click next month
      await user.click(screen.getByRole('button', { name: /next month/i }));

      // Should now show February
      const monthSelect = screen.getAllByRole('combobox')[0];
      expect(monthSelect).toHaveValue('1'); // February
    });
  });

  describe('min/max constraints', () => {
    it('should apply disabled styling to dates before min date', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      // Provide a value in January so calendar opens to January
      render(<DatePicker value="2025-01-20" onChange={vi.fn()} min="2025-01-15" />);

      // Open calendar
      await user.click(screen.getByRole('button'));

      // Day 10 should have disabled styling (opacity and cursor-not-allowed)
      const day10 = screen.getByRole('button', { name: '10' });
      expect(day10).toHaveClass('opacity-50');
      expect(day10).toHaveClass('cursor-not-allowed');
    });

    it('should apply disabled styling to dates after max date', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      // Provide a value in January so calendar opens to January
      render(<DatePicker value="2025-01-15" onChange={vi.fn()} max="2025-01-20" />);

      // Open calendar
      await user.click(screen.getByRole('button'));

      // Day 25 should have disabled styling
      const day25 = screen.getByRole('button', { name: '25' });
      expect(day25).toHaveClass('opacity-50');
    });

    it('should not call onChange when disabled date is clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const handleChange = vi.fn();
      // Provide a value in January so calendar opens to January
      render(<DatePicker value="2025-01-20" onChange={handleChange} min="2025-01-15" />);

      // Open calendar
      await user.click(screen.getByRole('button'));

      // Try to click disabled day 10 - it has disabled attribute
      const day10 = screen.getByRole('button', { name: '10' });
      // The button is disabled via the disabled attribute
      expect(day10).toBeDisabled();

      // Clicking a disabled button should not trigger onChange
      await user.click(day10);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should not open calendar when disabled', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<DatePicker value="" onChange={vi.fn()} disabled />);

      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();

      await user.click(trigger);

      // Calendar should not open
      expect(screen.queryByRole('button', { name: /previous month/i })).not.toBeInTheDocument();
    });

    it('should apply disabled styling', () => {
      render(<DatePicker value="" onChange={vi.fn()} disabled />);

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveClass('cursor-not-allowed');
    });
  });

  describe('inline display mode', () => {
    it('should render calendar inline when display is inline', () => {
      render(<DatePicker display="inline" value="" onChange={vi.fn()} />);

      // Calendar should be visible without clicking
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
    });

    it('should not close calendar after selecting a date in inline mode', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<DatePicker display="inline" value="" onChange={vi.fn()} />);

      // Select a date
      await user.click(screen.getByRole('button', { name: '15' }));

      // Calendar should still be visible
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
    });
  });

  describe('range mode', () => {
    it('should handle range value', () => {
      const rangeValue: DateRange = { start: '2025-01-10', end: '2025-01-20' };
      render(<DatePicker mode="range" value={rangeValue} onChange={vi.fn()} />);

      // Should display range in format "start - end"
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });

    it('should set start date when clicking first date in range mode', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const handleChange = vi.fn();
      // Pass a start date so the calendar opens to January
      const rangeValue: DateRange = { start: '2025-01-01', end: null };
      render(<DatePicker mode="range" value={rangeValue} onChange={handleChange} />);

      // Open calendar and select a different start date (this will reset range)
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: '10' }));

      // Since there's already a start without end, clicking completes the range
      expect(handleChange).toHaveBeenCalledWith({ start: '2025-01-01', end: '2025-01-10' });
    });

    it('should complete range when second date is selected', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const rangeValue: DateRange = { start: '2025-01-10', end: null };
      render(<DatePicker mode="range" value={rangeValue} onChange={handleChange} />);

      // Open calendar and select end date
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: '20' }));

      expect(handleChange).toHaveBeenCalledWith({ start: '2025-01-10', end: '2025-01-20' });
    });

    it('should swap dates if end date is before start date', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const rangeValue: DateRange = { start: '2025-01-20', end: null };
      render(<DatePicker mode="range" value={rangeValue} onChange={handleChange} />);

      // Open calendar and select date before start
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: '10' }));

      expect(handleChange).toHaveBeenCalledWith({ start: '2025-01-10', end: '2025-01-20' });
    });
  });

  describe('accessibility', () => {
    it('should have accessible label', () => {
      render(<DatePicker label="Due Date" value="" onChange={vi.fn()} />);

      expect(screen.getByText('Due Date')).toBeInTheDocument();
    });

    it('should have navigation buttons with aria-labels', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<DatePicker value="" onChange={vi.fn()} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
    });

    it('should apply error styling when error present', () => {
      render(<DatePicker value="" onChange={vi.fn()} error="Invalid date" />);

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveClass('border-red-500/50');
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to container div', () => {
      const ref = createRef<HTMLDivElement>();
      render(<DatePicker ref={ref} value="" onChange={vi.fn()} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('today indicator', () => {
    it('should highlight today with ring indicator when viewing current month', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      // Get today's date
      const today = new Date();
      const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

      render(<DatePicker value={todayValue} onChange={vi.fn()} />);

      await user.click(screen.getByRole('button'));

      // Today should have ring-1 class (today indicator)
      // Find the button for today's date
      const todayDay = screen.getByRole('button', { name: String(today.getDate()) });
      expect(todayDay).toHaveClass('ring-1');
    });
  });
});
