import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalActions } from './ModalActions';

describe('ModalActions', () => {
  it('renders children correctly', () => {
    render(
      <ModalActions>
        <button>Cancel</button>
        <button>Submit</button>
      </ModalActions>
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('applies right alignment by default', () => {
    const { container } = render(
      <ModalActions>
        <button>Action</button>
      </ModalActions>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('justify-end');
  });

  it('applies left alignment', () => {
    const { container } = render(
      <ModalActions align="left">
        <button>Action</button>
      </ModalActions>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('justify-start');
  });

  it('applies between alignment', () => {
    const { container } = render(
      <ModalActions align="between">
        <button>Left</button>
        <button>Right</button>
      </ModalActions>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('justify-between');
  });

  it('applies center alignment', () => {
    const { container } = render(
      <ModalActions align="center">
        <button>Action</button>
      </ModalActions>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('justify-center');
  });

  it('includes top border and padding', () => {
    const { container } = render(
      <ModalActions>
        <button>Action</button>
      </ModalActions>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('border-t');
    expect(wrapper).toHaveClass('pt-4');
    expect(wrapper).toHaveClass('mt-6');
  });

  it('applies flex layout with gap', () => {
    const { container } = render(
      <ModalActions>
        <button>Action</button>
      </ModalActions>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('gap-3');
  });

  it('merges custom className', () => {
    const { container } = render(
      <ModalActions className="custom-class">
        <button>Action</button>
      </ModalActions>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
    expect(wrapper).toHaveClass('flex');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <ModalActions data-testid="modal-actions" aria-label="Actions">
        <button>Action</button>
      </ModalActions>
    );
    const element = screen.getByTestId('modal-actions');
    expect(element).toHaveAttribute('aria-label', 'Actions');
  });

  it('renders multiple buttons with proper spacing', () => {
    const { container } = render(
      <ModalActions>
        <button>Cancel</button>
        <button>Delete</button>
        <button>Save</button>
      </ModalActions>
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
  });
});
