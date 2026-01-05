import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders an icon with the correct SVG path', () => {
    const { container } = render(<Icon name="home" />);
    const svg = container.querySelector('svg');
    const path = container.querySelector('path');

    expect(svg).toBeInTheDocument();
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute('d')).toContain('M3 12l2-2m0 0l7-7');
  });

  it('applies custom className', () => {
    const { container } = render(<Icon name="clipboard" className="custom-class h-6 w-6" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveClass('custom-class', 'h-6', 'w-6');
  });

  it('renders all available icons without errors', () => {
    const iconNames: Array<Parameters<typeof Icon>[0]['name']> = [
      'home',
      'clipboard',
      'document',
      'box',
      'cog',
      'truck',
      'cash',
      'chart-bar',
      'users',
      'chevron-left',
      'logout',
    ];

    iconNames.forEach(name => {
      const { container, unmount } = render(<Icon name={name} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      unmount();
    });
  });

  it('returns null and warns for unknown icon names', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // @ts-expect-error Testing invalid icon name
    const { container } = render(<Icon name="unknown-icon" />);

    expect(container.firstChild).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith('Icon "unknown-icon" not found');

    consoleWarnSpy.mockRestore();
  });

  it('forwards additional SVG props', () => {
    const { container } = render(
      <Icon name="home" data-testid="test-icon" aria-label="Home icon" />
    );
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('data-testid', 'test-icon');
    expect(svg).toHaveAttribute('aria-label', 'Home icon');
  });

  it('has correct default SVG attributes', () => {
    const { container } = render(<Icon name="home" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('path has correct stroke attributes', () => {
    const { container } = render(<Icon name="home" />);
    const path = container.querySelector('path');

    expect(path).toHaveAttribute('stroke-linecap', 'round');
    expect(path).toHaveAttribute('stroke-linejoin', 'round');
    expect(path).toHaveAttribute('stroke-width', '1.5');
  });
});
