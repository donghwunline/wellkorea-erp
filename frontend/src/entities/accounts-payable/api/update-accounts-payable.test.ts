/**
 * Update AccountsPayable Command Tests.
 *
 * Tests for mapping and API call behavior.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateAccountsPayable, type UpdateAPInput } from './update-accounts-payable';

// =============================================================================
// Mock Setup
// =============================================================================

const mockHttpClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api');
  return {
    ...actual,
    httpClient: mockHttpClient,
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(overrides?: Partial<UpdateAPInput>): UpdateAPInput {
  return {
    dueDate: '2025-06-15',
    notes: 'Test notes',
    ...overrides,
  };
}

function createMockUpdateResponse(id = 1) {
  return {
    id,
    message: 'Updated successfully',
  };
}

describe('updateAccountsPayable', () => {
  const apId = 123;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.patch.mockResolvedValue(createMockUpdateResponse(apId));
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should pass dueDate to request', async () => {
      const input = createValidInput({ dueDate: '2025-06-15' });

      await updateAccountsPayable(apId, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/accounts-payable/${apId}`,
        expect.objectContaining({ dueDate: '2025-06-15' })
      );
    });

    it('should pass null dueDate to request when clearing', async () => {
      const input = createValidInput({ dueDate: null });

      await updateAccountsPayable(apId, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/accounts-payable/${apId}`,
        expect.objectContaining({ dueDate: null })
      );
    });

    it('should convert undefined dueDate to null in request', async () => {
      const input: UpdateAPInput = { notes: 'Only updating notes' };

      await updateAccountsPayable(apId, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/accounts-payable/${apId}`,
        expect.objectContaining({ dueDate: null })
      );
    });

    it('should trim notes and convert empty string to null', async () => {
      const input = createValidInput({ notes: '   ' });

      await updateAccountsPayable(apId, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/accounts-payable/${apId}`,
        expect.objectContaining({ notes: null })
      );
    });

    it('should convert null notes to null in request', async () => {
      const input = createValidInput({ notes: null });

      await updateAccountsPayable(apId, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/accounts-payable/${apId}`,
        expect.objectContaining({ notes: null })
      );
    });

    it('should pass undefined notes when not changing (undefined = dont change)', async () => {
      const input: UpdateAPInput = { dueDate: '2025-06-15' };

      await updateAccountsPayable(apId, input);

      const [, requestBody] = mockHttpClient.patch.mock.calls[0];
      expect(requestBody.notes).toBeUndefined();
    });

    it('should trim notes whitespace when non-empty', async () => {
      const input = createValidInput({ notes: '  Valid notes with spaces  ' });

      await updateAccountsPayable(apId, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/accounts-payable/${apId}`,
        expect.objectContaining({ notes: 'Valid notes with spaces' })
      );
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.patch with correct endpoint including id', async () => {
      const input = createValidInput();

      await updateAccountsPayable(456, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/accounts-payable/456',
        expect.any(Object)
      );
    });

    it('should return UpdateAPResult on success', async () => {
      const expectedResponse = createMockUpdateResponse(apId);
      mockHttpClient.patch.mockResolvedValue(expectedResponse);
      const input = createValidInput();

      const result = await updateAccountsPayable(apId, input);

      expect(result).toEqual(expectedResponse);
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.patch.mockRejectedValue(error);
      const input = createValidInput();

      await expect(updateAccountsPayable(apId, input)).rejects.toThrow('Network error');
    });

    it('should propagate validation errors from backend', async () => {
      const validationError = {
        status: 400,
        message: 'Invalid due date',
      };
      mockHttpClient.patch.mockRejectedValue(validationError);
      const input = createValidInput();

      await expect(updateAccountsPayable(apId, input)).rejects.toEqual(validationError);
    });

    it('should handle different AP IDs', async () => {
      const input = createValidInput();

      await updateAccountsPayable(1, input);
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/accounts-payable/1', expect.any(Object));

      await updateAccountsPayable(999, input);
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/accounts-payable/999', expect.any(Object));
    });
  });

  // ==========================================================================
  // Edge Case Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty input object', async () => {
      const input: UpdateAPInput = {};

      await updateAccountsPayable(apId, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/accounts-payable/${apId}`,
        { dueDate: null, notes: undefined }
      );
    });

    it('should handle both fields being updated at once', async () => {
      const input: UpdateAPInput = {
        dueDate: '2025-12-31',
        notes: 'Year end payment',
      };

      await updateAccountsPayable(apId, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/accounts-payable/${apId}`,
        { dueDate: '2025-12-31', notes: 'Year end payment' }
      );
    });

    it('should handle both fields being cleared at once', async () => {
      const input: UpdateAPInput = {
        dueDate: null,
        notes: null,
      };

      await updateAccountsPayable(apId, input);

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/accounts-payable/${apId}`,
        { dueDate: null, notes: null }
      );
    });
  });
});
