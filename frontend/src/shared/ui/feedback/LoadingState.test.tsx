import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders centered variant with default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders centered variant with custom message', () => {
    render(<LoadingState message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders spinner-only variant without message', () => {
    render(<LoadingState variant="spinner" message="Should not show" />);
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  it('renders table variant with colspan', () => {
    const { container } = render(
      <table>
        <tbody>
          <LoadingState variant="table" colspan={5} />
        </tbody>
      </table>
    );
    const td = container.querySelector('td');
    expect(td).toHaveAttribute('colSpan', '5');
  });

  it('renders table variant with message', () => {
    render(
      <table>
        <tbody>
          <LoadingState variant="table" message="Loading data..." />
        </tbody>
      </table>
    );
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('hides message when not provided', () => {
    render(<LoadingState message="" />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('applies custom className for centered variant', () => {
    const { container } = render(<LoadingState className="custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
    expect(wrapper).toHaveClass('flex');
  });

  it('applies custom className for table variant', () => {
    const { container } = render(
      <table>
        <tbody>
          <LoadingState variant="table" className="custom-table-class" />
        </tbody>
      </table>
    );
    const td = container.querySelector('td');
    expect(td).toHaveClass('custom-table-class');
  });

  it('passes through additional HTML attributes', () => {
    render(<LoadingState data-testid="loading-state" aria-busy="true" />);
    const element = screen.getByTestId('loading-state');
    expect(element).toHaveAttribute('aria-busy', 'true');
  });
});
