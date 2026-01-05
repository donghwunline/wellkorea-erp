import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('renders title correctly', () => {
    render(<SectionHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders title as heading element', () => {
    render(<SectionHeader title="Section Heading" />);
    const heading = screen.getByRole('heading', { name: 'Section Heading' });
    expect(heading).toBeInTheDocument();
  });

  it('renders children on the right side', () => {
    render(
      <SectionHeader title="Title">
        <span data-testid="action">Action Button</span>
      </SectionHeader>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByTestId('action')).toBeInTheDocument();
  });

  it('applies proper layout with flexbox', () => {
    const { container } = render(<SectionHeader title="Title" />);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('items-center');
    expect(header).toHaveClass('justify-between');
  });

  it('merges custom className', () => {
    const { container } = render(<SectionHeader title="Title" className="custom-class" />);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('custom-class');
    expect(header).toHaveClass('flex');
  });

  it('applies title styling', () => {
    render(<SectionHeader title="Styled Title" />);
    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('text-lg');
    expect(heading).toHaveClass('font-semibold');
  });

  it('renders without children', () => {
    const { container } = render(<SectionHeader title="Only Title" />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText('Only Title')).toBeInTheDocument();
  });

  it('passes through additional HTML attributes', () => {
    render(<SectionHeader title="Title" data-testid="section-header" aria-label="Section" />);
    const header = screen.getByTestId('section-header');
    expect(header).toHaveAttribute('aria-label', 'Section');
  });
});
