/**
 * Create Service Category Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createServiceCategory,
  ServiceCategoryValidationError,
  type CreateServiceCategoryInput,
} from './create-service-category';
import { createCommandResult } from '@/test/entity-test-utils';

// =============================================================================
// Mock Setup
// =============================================================================

const mockHttpClient = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api');
  return {
    ...actual,
    httpClient: mockHttpClient,
    SERVICE_CATEGORY_ENDPOINTS: {
      BASE: '/api/service-categories',
      byId: (id: number) => `/api/service-categories/${id}`,
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(
  overrides?: Partial<CreateServiceCategoryInput>
): CreateServiceCategoryInput {
  return {
    name: 'Laser Cutting',
    description: 'Metal cutting services',
    ...overrides,
  };
}

describe('createServiceCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue(createCommandResult(1));
  });

  // ==========================================================================
  // Validation Tests - Name
  // ==========================================================================

  describe('validation - name', () => {
    it('should pass with valid name', async () => {
      const input = createValidInput({ name: 'Laser Cutting' });
      await expect(createServiceCategory(input)).resolves.not.toThrow();
    });

    it('should throw error when name is empty', async () => {
      const input = createValidInput({ name: '' });

      await expect(createServiceCategory(input)).rejects.toThrow(
        ServiceCategoryValidationError
      );
      await expect(createServiceCategory(input)).rejects.toThrow(
        'Category name is required'
      );
    });

    it('should throw error when name is whitespace only', async () => {
      const input = createValidInput({ name: '   ' });

      await expect(createServiceCategory(input)).rejects.toThrow(
        ServiceCategoryValidationError
      );
    });

    it('should throw error when name is less than 2 characters', async () => {
      const input = createValidInput({ name: 'A' });

      await expect(createServiceCategory(input)).rejects.toThrow(
        ServiceCategoryValidationError
      );
      await expect(createServiceCategory(input)).rejects.toThrow(
        'Category name must be at least 2 characters'
      );
    });

    it('should pass when name is exactly 2 characters', async () => {
      const input = createValidInput({ name: 'AB' });
      await expect(createServiceCategory(input)).resolves.not.toThrow();
    });

    it('should throw error when name exceeds 100 characters', async () => {
      const input = createValidInput({ name: 'A'.repeat(101) });

      await expect(createServiceCategory(input)).rejects.toThrow(
        ServiceCategoryValidationError
      );
      await expect(createServiceCategory(input)).rejects.toThrow(
        'Category name must not exceed 100 characters'
      );
    });

    it('should pass when name is exactly 100 characters', async () => {
      const input = createValidInput({ name: 'A'.repeat(100) });
      await expect(createServiceCategory(input)).resolves.not.toThrow();
    });

    it('should include field name in error', async () => {
      const input = createValidInput({ name: '' });

      try {
        await createServiceCategory(input);
      } catch (error) {
        const e = error as ServiceCategoryValidationError;
        expect(e.field).toBe('name');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Description
  // ==========================================================================

  describe('validation - description', () => {
    it('should pass when description is undefined', async () => {
      const input = createValidInput({ description: undefined });
      await expect(createServiceCategory(input)).resolves.not.toThrow();
    });

    it('should pass when description is null', async () => {
      const input = createValidInput({ description: null });
      await expect(createServiceCategory(input)).resolves.not.toThrow();
    });

    it('should pass when description is empty string', async () => {
      const input = createValidInput({ description: '' });
      await expect(createServiceCategory(input)).resolves.not.toThrow();
    });

    it('should throw error when description exceeds 500 characters', async () => {
      const input = createValidInput({ description: 'A'.repeat(501) });

      await expect(createServiceCategory(input)).rejects.toThrow(
        ServiceCategoryValidationError
      );
      await expect(createServiceCategory(input)).rejects.toThrow(
        'Description must not exceed 500 characters'
      );
    });

    it('should pass when description is exactly 500 characters', async () => {
      const input = createValidInput({ description: 'A'.repeat(500) });
      await expect(createServiceCategory(input)).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should trim name whitespace', async () => {
      const input = createValidInput({ name: '  Laser Cutting  ' });

      await createServiceCategory(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/service-categories',
        expect.objectContaining({ name: 'Laser Cutting' })
      );
    });

    it('should trim description whitespace', async () => {
      const input = createValidInput({ description: '  Metal cutting services  ' });

      await createServiceCategory(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/service-categories',
        expect.objectContaining({ description: 'Metal cutting services' })
      );
    });

    it('should convert empty description to null', async () => {
      const input = createValidInput({ description: '' });

      await createServiceCategory(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/service-categories',
        expect.objectContaining({ description: null })
      );
    });

    it('should convert whitespace-only description to null', async () => {
      const input = createValidInput({ description: '   ' });

      await createServiceCategory(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/service-categories',
        expect.objectContaining({ description: null })
      );
    });

    it('should map all fields correctly', async () => {
      const input: CreateServiceCategoryInput = {
        name: 'Sheet Metal',
        description: 'Bending and forming',
      };

      await createServiceCategory(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/service-categories', {
        name: 'Sheet Metal',
        description: 'Bending and forming',
      });
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct endpoint', async () => {
      const input = createValidInput();

      await createServiceCategory(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/service-categories',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.post.mockResolvedValue({ id: 123, message: 'Created' });
      const input = createValidInput();

      const result = await createServiceCategory(input);

      expect(result).toEqual({ id: 123, message: 'Created' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);
      const input = createValidInput();

      await expect(createServiceCategory(input)).rejects.toThrow('Network error');
    });

    it('should not call API when validation fails', async () => {
      const input = createValidInput({ name: '' });

      try {
        await createServiceCategory(input);
      } catch {
        // Expected
      }

      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
});
