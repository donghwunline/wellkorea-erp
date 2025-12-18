/**
 * Shared component test utilities.
 *
 * This module provides reusable helpers for:
 * - DOM element selection
 * - Form input helpers
 * - Common test patterns
 *
 * Usage:
 * ```typescript
 * import { getInputByLabel, getInputByPlaceholder } from '@/test/helpers';
 *
 * const emailInput = getInputByLabel('Email');
 * const passwordInput = getInputByPlaceholder('Enter password');
 * ```
 */

import { screen } from '@testing-library/react';

// ============================================================================
// DOM Selectors
// ============================================================================

/**
 * Gets an input element by its associated label text.
 * Works with labels that wrap inputs or use htmlFor.
 *
 * @example
 * ```typescript
 * const emailInput = getInputByLabel('Email');
 * await user.type(emailInput, 'test@example.com');
 * ```
 */
export function getInputByLabel(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText, { exact: false });
  const container = label.closest('div.flex.flex-col');
  const input = container?.querySelector('input');
  if (!input) {
    throw new Error(`Could not find input for label "${labelText}"`);
  }
  return input as HTMLInputElement;
}

/**
 * Gets an input element by its placeholder text.
 *
 * @example
 * ```typescript
 * const passwordInput = getInputByPlaceholder('Enter password');
 * ```
 */
export function getInputByPlaceholder(placeholder: string): HTMLInputElement {
  return screen.getByPlaceholderText(placeholder) as HTMLInputElement;
}

/**
 * Gets a button element by its text content (case-insensitive).
 *
 * @example
 * ```typescript
 * const submitButton = getButtonByText('Submit');
 * await user.click(submitButton);
 * ```
 */
export function getButtonByText(text: string): HTMLButtonElement {
  return screen.getByRole('button', { name: new RegExp(text, 'i') }) as HTMLButtonElement;
}

/**
 * Queries (optional) a button by text - returns null if not found.
 */
export function queryButtonByText(text: string): HTMLButtonElement | null {
  return screen.queryByRole('button', { name: new RegExp(text, 'i') }) as HTMLButtonElement | null;
}

// ============================================================================
// Modal Helpers
// ============================================================================

/**
 * Gets the modal dialog element.
 */
export function getModal(): HTMLElement {
  return screen.getByRole('dialog');
}

/**
 * Queries (optional) the modal dialog - returns null if not found.
 */
export function queryModal(): HTMLElement | null {
  return screen.queryByRole('dialog');
}

/**
 * Checks if a modal is currently visible.
 */
export function isModalVisible(): boolean {
  return queryModal() !== null;
}

// ============================================================================
// Form State Helpers
// ============================================================================

/**
 * Checks if a form element is disabled.
 */
export function isDisabled(element: HTMLElement): boolean {
  return element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
}

/**
 * Gets all form inputs that are currently disabled.
 */
export function getDisabledInputs(): HTMLInputElement[] {
  const inputs = document.querySelectorAll('input:disabled');
  return Array.from(inputs) as HTMLInputElement[];
}
