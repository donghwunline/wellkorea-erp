/**
 * Tests for navigation utility (window.location wrapper)
 */

import {describe, it, expect} from 'vitest';
import {navigation} from './navigation';

describe('navigation utility', () => {
  describe('API surface', () => {
    it('should export redirectToLogin function', () => {
      expect(typeof navigation.redirectToLogin).toBe('function');
    });

    it('should export reloadPage function', () => {
      expect(typeof navigation.reloadPage).toBe('function');
    });
  });

  describe('function calls', () => {
    it('should not throw when calling redirectToLogin', () => {
      // In test environment, these functions check for location existence
      // and return early if not available
      expect(() => navigation.redirectToLogin()).not.toThrow();
    });

    it('should not throw when calling reloadPage', () => {
      expect(() => navigation.reloadPage()).not.toThrow();
    });
  });
});
