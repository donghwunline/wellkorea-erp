/**
 * useCreateDelivery Hook Tests.
 *
 * Tests for mutation behavior, callbacks, and cache invalidation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCreateDelivery } from './use-create-delivery';
import {
  createQueryWrapper,
  createTestQueryClient,
  createCommandResult,
} from '@/test/entity-test-utils';
import type { CreateDeliveryInput } from '@/entities/delivery';

// =============================================================================
// Mock Setup
// =============================================================================

const mockCreateDelivery = vi.fn();

vi.mock('@/entities/delivery', async () => {
  const actual = await vi.importActual('@/entities/delivery');
  return {
    ...actual,
    createDelivery: (...args: unknown[]) => mockCreateDelivery(...args),
    deliveryQueries: {
      all: () => ['deliveries'],
      lists: () => ['deliveries', 'list'],
      list: () => ({
        queryKey: ['deliveries', 'list'],
        queryFn: vi.fn(),
      }),
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(overrides?: Partial<CreateDeliveryInput>): CreateDeliveryInput {
  return {
    projectId: 100,
    quotationId: 200,
    deliveryDate: '2025-01-07',
    lineItems: [
      { productId: 1, quantityDelivered: 10 },
      { productId: 2, quantityDelivered: 20 },
    ],
    notes: 'Test delivery',
    ...overrides,
  };
}

describe('useCreateDelivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateDelivery.mockResolvedValue(createCommandResult(1, 'Delivery created'));
  });

  // ==========================================================================
  // Basic Hook Behavior
  // ==========================================================================

  describe('basic hook behavior', () => {
    it('should return mutation object with expected properties', () => {
      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('data');
    });

    it('should have isPending = false initially', () => {
      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isPending).toBe(false);
    });

    it('should have isSuccess = false initially', () => {
      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isSuccess).toBe(false);
    });

    it('should have isError = false initially', () => {
      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isError).toBe(false);
    });
  });

  // ==========================================================================
  // Mutation Execution
  // ==========================================================================

  describe('mutation execution', () => {
    it('should call createDelivery with input when mutate is called', async () => {
      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      const input = createValidInput();

      act(() => {
        result.current.mutate(input);
      });

      await waitFor(() => {
        expect(mockCreateDelivery).toHaveBeenCalledWith(input);
      });
    });

    it('should set isPending = true while mutation is in progress', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockCreateDelivery.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      // Wait for isPending to become true
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Resolve the promise to complete the mutation
      act(() => {
        resolvePromise!(createCommandResult(1));
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    it('should set isSuccess = true on successful mutation', async () => {
      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should return command result data on success', async () => {
      mockCreateDelivery.mockResolvedValue({ id: 123, message: 'Delivery created' });

      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 123, message: 'Delivery created' });
      });
    });
  });

  // ==========================================================================
  // Callback Tests
  // ==========================================================================

  describe('callbacks', () => {
    it('should call onSuccess callback with result on successful mutation', async () => {
      const onSuccess = vi.fn();
      mockCreateDelivery.mockResolvedValue({ id: 456, message: 'Success' });

      const { result } = renderHook(() => useCreateDelivery({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({ id: 456, message: 'Success' });
      });
    });

    it('should call onError callback with error on failed mutation', async () => {
      const onError = vi.fn();
      const error = new Error('Network error');
      mockCreateDelivery.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateDelivery({ onError }), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('should not call onSuccess when mutation fails', async () => {
      const onSuccess = vi.fn();
      mockCreateDelivery.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useCreateDelivery({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should not call onError when mutation succeeds', async () => {
      const onError = vi.fn();
      mockCreateDelivery.mockResolvedValue(createCommandResult(1));

      const { result } = renderHook(() => useCreateDelivery({ onError }), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onError).not.toHaveBeenCalled();
    });

    it('should work without any callbacks', async () => {
      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Cache Invalidation
  // ==========================================================================

  describe('cache invalidation', () => {
    it('should invalidate delivery queries on success', async () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(queryClient),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['deliveries'],
        });
      });
    });

    it('should not invalidate queries on failure', async () => {
      mockCreateDelivery.mockRejectedValue(new Error('Failed'));

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(queryClient),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    it('should set isError = true on failed mutation', async () => {
      mockCreateDelivery.mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should store error object on failed mutation', async () => {
      const error = new Error('Validation failed');
      mockCreateDelivery.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.error).toBe(error);
      });
    });

    it('should reset error state on subsequent successful mutation', async () => {
      const error = new Error('First attempt failed');
      mockCreateDelivery.mockRejectedValueOnce(error);
      mockCreateDelivery.mockResolvedValueOnce(createCommandResult(1));

      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      // First mutation - fails
      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Second mutation - succeeds
      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isError).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle multiple rapid mutations', async () => {
      let callCount = 0;
      mockCreateDelivery.mockImplementation(async () => {
        callCount++;
        return createCommandResult(callCount, `Delivery ${callCount}`);
      });

      const { result } = renderHook(() => useCreateDelivery(), {
        wrapper: createQueryWrapper(),
      });

      // Trigger multiple mutations rapidly
      act(() => {
        result.current.mutate(createValidInput({ projectId: 1 }));
        result.current.mutate(createValidInput({ projectId: 2 }));
        result.current.mutate(createValidInput({ projectId: 3 }));
      });

      await waitFor(() => {
        expect(mockCreateDelivery).toHaveBeenCalledTimes(3);
      });
    });

    it('should handle empty options object', async () => {
      const { result } = renderHook(() => useCreateDelivery({}), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle undefined options', async () => {
      const { result } = renderHook(() => useCreateDelivery(undefined), {
        wrapper: createQueryWrapper(),
      });

      act(() => {
        result.current.mutate(createValidInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
