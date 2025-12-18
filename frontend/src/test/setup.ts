/**
 * Vitest test environment setup
 *
 * This file is automatically loaded before all tests.
 * It configures the test environment, mocks, and global utilities.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
});

// Mock ResizeObserver (not implemented in jsdom)
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver (not implemented in jsdom)
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress expected console errors in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React error boundary errors (expected in ErrorBoundary tests)
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ErrorBoundary') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('Could not parse CSS stylesheet'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    // Suppress React warnings in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOM.render') || args[0].includes('act('))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
