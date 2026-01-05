import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

const TestIcon = () => (
  <svg className="h-5 w-5" data-testid="test-icon">
    <path d="M0 0" />
  </svg>
);

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Users" value="1,234" icon={<TestIcon />} />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders with numeric value', () => {
    render(<StatCard label="Count" value={42} icon={<TestIcon />} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<StatCard label="Test" value="100" icon={<TestIcon />} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders without trend', () => {
    render(<StatCard label="Test" value="100" icon={<TestIcon />} />);
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
  });

  it('renders trend with up direction', () => {
    render(
      <StatCard
        label="Revenue"
        value="$10k"
        icon={<TestIcon />}
        trend={{ value: '+12%', direction: 'up' }}
      />
    );
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toHaveClass('text-green-400');
  });

  it('renders trend with down direction', () => {
    render(
      <StatCard
        label="Sales"
        value="500"
        icon={<TestIcon />}
        trend={{ value: '-5%', direction: 'down' }}
      />
    );
    expect(screen.getByText('-5%')).toBeInTheDocument();
    expect(screen.getByText('-5%')).toHaveClass('text-red-400');
  });

  it('renders trend with neutral direction', () => {
    render(
      <StatCard
        label="Orders"
        value="100"
        icon={<TestIcon />}
        trend={{ value: '0%', direction: 'neutral' }}
      />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toHaveClass('text-steel-400');
  });

  it('applies card styling classes', () => {
    const { container } = render(<StatCard label="Test" value="100" icon={<TestIcon />} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('bg-steel-900/60');
    expect(card).toHaveClass('p-4');
  });

  it('merges custom className', () => {
    const { container } = render(
      <StatCard label="Test" value="100" icon={<TestIcon />} className="custom-class" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('rounded-xl');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<StatCard ref={ref} label="Test" value="100" icon={<TestIcon />} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes through additional HTML attributes', () => {
    render(
      <StatCard
        label="Test"
        value="100"
        icon={<TestIcon />}
        data-testid="stat-card"
        aria-label="Statistics"
      />
    );
    const card = screen.getByTestId('stat-card');
    expect(card).toHaveAttribute('aria-label', 'Statistics');
  });

  it('displays large value with proper styling', () => {
    render(<StatCard label="Test" value="100" icon={<TestIcon />} />);
    const valueElement = screen.getByText('100');
    expect(valueElement).toHaveClass('text-2xl');
    expect(valueElement).toHaveClass('font-bold');
    expect(valueElement).toHaveClass('text-white');
  });

  it('displays label with proper styling', () => {
    render(<StatCard label="Test Label" value="100" icon={<TestIcon />} />);
    const labelElement = screen.getByText('Test Label');
    expect(labelElement).toHaveClass('text-sm');
    expect(labelElement).toHaveClass('text-steel-400');
  });
});
