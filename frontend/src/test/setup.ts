/**
 * Vitest test environment setup
 *
 * This file is automatically loaded before all tests.
 * It configures the test environment, mocks, and global utilities.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

/**
 * Mock translations for testing.
 * Maps i18n keys to English strings that tests expect.
 */
const mockTranslations: Record<string, string> = {
  // Auth translations
  'login.title': 'Login',
  'login.subtitle': 'Integrated Work System',
  'login.username': 'Username',
  'login.usernamePlaceholder': 'Enter your username',
  'login.password': 'Password',
  'login.passwordPlaceholder': 'Enter your password',
  'login.rememberMe': 'Remember me',
  'login.submit': 'Sign in',
  'login.submitting': 'Signing in...',

  // Navigation translations
  'navigation:sections.operations': 'Operations',
  'navigation:sections.masterData': 'Master Data',
  'navigation:sections.reports': 'Reports',
  'navigation:sections.approval': 'Approval',
  'navigation:sections.administration': 'Administration',
  'navigation:brand.name': 'WellKorea',
  'navigation:items.dashboard': 'Dashboard',
  'navigation:items.projects': 'Projects',
  'navigation:items.quotations': 'Quotations',
  'navigation:items.deliveries': 'Deliveries',
  'navigation:items.invoices': 'Invoices',
  'navigation:items.items': 'Items',
  'navigation:items.companies': 'CRM',
  'navigation:items.procurement': 'Procurement',
  'navigation:items.arApReports': 'AR/AP Reports',
  'navigation:items.pendingApprovals': 'Pending Approvals',
  'navigation:items.approvalSettings': 'Approval Settings',
  'navigation:items.userManagement': 'User Management',
  'navigation:items.auditLogs': 'Audit Logs',

  // Common translations
  'common:accessDenied.title': 'Access Denied',
  'common:accessDenied.description': "You don't have permission to access this page",
  'common:accessDenied.goHome': 'Go to Home',
  'common:notFound.title': 'Page Not Found',
  'common:notFound.description': 'The page you requested does not exist',
  'common:notFound.goHome': 'Go to Home',
  'common:buttons.save': 'Save',
  'common:buttons.cancel': 'Cancel',
  'common:buttons.delete': 'Delete',
  'common:buttons.edit': 'Edit',
  'common:buttons.create': 'Create',

  // Validation translations
  'validation:requiredField': '{{field}} is required',
  'validation:required': 'This field is required',

  // Error translations - these should match test expectations
  'errors:codes.AUTH_001': 'Invalid username or password',
  'errors:codes.AUTH_003': 'Session expired',
};

/**
 * Translation function that mimics i18next t() behavior.
 * Returns the mapped translation or the key itself.
 */
function mockT(key: string, options?: Record<string, unknown>): string {
  let result = mockTranslations[key] ?? key;

  // Handle interpolation (replace {{key}} with value)
  if (options) {
    for (const [optKey, optValue] of Object.entries(options)) {
      result = result.replace(new RegExp(`{{${optKey}}}`, 'g'), String(optValue));
    }
  }

  return result;
}

// Mock i18next for tests
vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string, options?: Record<string, unknown>) => {
      // If key already has namespace prefix, use as-is
      if (key.includes(':')) {
        return mockT(key, options);
      }
      // Otherwise, prepend namespace if provided
      const fullKey = namespace ? `${namespace}:${key}` : key;
      // Try with namespace first, then without
      return mockT(fullKey, options) !== fullKey ? mockT(fullKey, options) : mockT(key, options);
    },
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock the i18n instance used in non-React contexts (e.g., errorMessages.ts)
vi.mock('@/app/i18n', () => ({
  default: {
    t: (key: string, options?: Record<string, unknown>) => mockT(key, options),
    changeLanguage: vi.fn(),
    language: 'en',
  },
  changeLanguage: vi.fn(),
  getCurrentLanguage: () => 'en',
}));

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
