/**
 * useSendPurchaseOrder Hook Tests.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  createQueryWrapper,
} from '@/test/entity-test-utils';

const httpClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api');
  return { ...actual, httpClient };
});

import { useSendPurchaseOrder } from './use-send-purchase-order';

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

describe('useSendPurchaseOrder', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should call send purchase order API with correct parameters', async () => {
    mockSuccess('post', { id: 1 });

    const { result } = renderHook(() => useSendPurchaseOrder(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        purchaseOrderId: 1,
        to: 'test@example.com',
        ccEmails: ['cc@example.com'],
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/purchase-orders/1/send'),
      {
        to: 'test@example.com',
        ccEmails: ['cc@example.com'],
      }
    );
  });
});
