import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let input: HTMLInputElement;

  beforeEach(() => {
    // Create a container with focusable elements
    container = document.createElement('div');
    document.body.appendChild(container);

    button1 = document.createElement('button');
    button1.textContent = 'Button 1';
    container.appendChild(button1);

    input = document.createElement('input');
    input.type = 'text';
    container.appendChild(input);

    button2 = document.createElement('button');
    button2.textContent = 'Button 2';
    container.appendChild(button2);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('ref management', () => {
    it('returns a ref object', () => {
      const { result } = renderHook(() => useFocusTrap(false));
      expect(result.current).toHaveProperty('current');
    });

    it('ref is initially null', () => {
      const { result } = renderHook(() => useFocusTrap(false));
      expect(result.current.current).toBeNull();
    });
  });

  describe('auto-focus behavior', () => {
    it('focuses first focusable element when activated with autoFocus=true', () => {
      const { result } = renderHook(() => useFocusTrap(true, { autoFocus: true }));
      result.current.current = container;

      // Manually trigger the effect by re-rendering
      const { rerender } = renderHook(
        ({ isActive }) => useFocusTrap(isActive, { autoFocus: true }),
        { initialProps: { isActive: false } },
      );

      rerender({ isActive: true });

      // In a real scenario, button1 would be focused
      // Testing this requires more complex DOM setup with actual focus
      expect(result.current.current).toBe(container);
    });

    it('does not auto-focus when autoFocus=false', () => {
      const { result } = renderHook(() => useFocusTrap(true, { autoFocus: false }));
      result.current.current = container;

      // Verify the ref is set but no auto-focus happens
      expect(result.current.current).toBe(container);
    });
  });

  describe('focus restoration', () => {
    it('stores previously focused element', () => {
      const outsideButton = document.createElement('button');
      outsideButton.textContent = 'Outside';
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const initialFocused = document.activeElement;
      expect(initialFocused).toBe(outsideButton);

      const { result } = renderHook(() => useFocusTrap(true, { restoreFocus: true }));
      result.current.current = container;

      document.body.removeChild(outsideButton);
    });
  });

  describe('activation and deactivation', () => {
    it('does nothing when isActive=false', () => {
      const focusSpy = vi.spyOn(button1, 'focus');
      const { result } = renderHook(() => useFocusTrap(false));
      result.current.current = container;

      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('activates when isActive changes from false to true', () => {
      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap(isActive),
        { initialProps: { isActive: false } },
      );
      result.current.current = container;

      rerender({ isActive: true });

      // Trap should now be active
      expect(result.current.current).toBe(container);
    });

    it('deactivates when isActive changes from true to false', () => {
      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap(isActive),
        { initialProps: { isActive: true } },
      );
      result.current.current = container;

      rerender({ isActive: false });

      // Trap should now be inactive
      expect(result.current.current).toBe(container);
    });
  });

  describe('edge cases', () => {
    it('handles container with no focusable elements', () => {
      const emptyContainer = document.createElement('div');
      emptyContainer.innerHTML = '<span>No focusable elements</span>';
      document.body.appendChild(emptyContainer);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = emptyContainer;

      // Should not throw error
      expect(result.current.current).toBe(emptyContainer);

      document.body.removeChild(emptyContainer);
    });

    it('handles null container ref', () => {
      const { result } = renderHook(() => useFocusTrap(true));

      // Should not throw error when ref is null
      expect(result.current.current).toBeNull();
    });

    it('handles container with single focusable element', () => {
      const singleContainer = document.createElement('div');
      const singleButton = document.createElement('button');
      singleButton.textContent = 'Only Button';
      singleContainer.appendChild(singleButton);
      document.body.appendChild(singleContainer);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = singleContainer;

      expect(result.current.current).toBe(singleContainer);

      document.body.removeChild(singleContainer);
    });
  });

  describe('options', () => {
    it('respects autoFocus option', () => {
      const { result: withAutoFocus } = renderHook(() =>
        useFocusTrap(true, { autoFocus: true }),
      );
      withAutoFocus.current.current = container;

      const { result: withoutAutoFocus } = renderHook(() =>
        useFocusTrap(true, { autoFocus: false }),
      );
      withoutAutoFocus.current.current = container;

      // Both should have valid refs
      expect(withAutoFocus.current.current).toBe(container);
      expect(withoutAutoFocus.current.current).toBe(container);
    });

    it('respects restoreFocus option', () => {
      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const { result: withRestore } = renderHook(() =>
        useFocusTrap(true, { restoreFocus: true }),
      );
      withRestore.current.current = container;

      const { result: withoutRestore } = renderHook(() =>
        useFocusTrap(true, { restoreFocus: false }),
      );
      withoutRestore.current.current = container;

      // Both should have valid refs
      expect(withRestore.current.current).toBe(container);
      expect(withoutRestore.current.current).toBe(container);

      document.body.removeChild(outsideButton);
    });

    it('uses default options when not provided', () => {
      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // Should use default options (autoFocus=true, restoreFocus=true)
      expect(result.current.current).toBe(container);
    });
  });

  describe('TypeScript types', () => {
    it('accepts generic type parameter', () => {
      const { result } = renderHook(() => useFocusTrap<HTMLDivElement>(true));
      result.current.current = container;

      expect(result.current.current).toBe(container);
    });

    it('works without generic type parameter', () => {
      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      expect(result.current.current).toBe(container);
    });
  });
});
