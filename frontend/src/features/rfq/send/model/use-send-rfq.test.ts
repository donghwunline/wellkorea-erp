/**
 * useSendRfq Hook Tests.
 */

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@/test/entity-test-utils';
import { useSendRfq } from './use-send-rfq';

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

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

describe('useSendRfq', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should call send RFQ API with correct parameters', async () => {
    mockSuccess('post', { id: 1 });

    const { result } = renderHook(() => useSendRfq(), {
      wrapper: createQueryWrapper(),
    });

    const input = {
      purchaseRequestId: 1,
      vendorIds: [10, 20],
      vendorEmails: {
        10: { to: 'vendor1@test.com', ccEmails: ['cc1@test.com'] },
        20: { to: 'vendor2@test.com' },
      },
    };

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/purchase-requests/1/send-rfq'),
      {
        vendorIds: [10, 20],
        vendorEmails: {
          10: { to: 'vendor1@test.com', ccEmails: ['cc1@test.com'] },
          20: { to: 'vendor2@test.com', ccEmails: undefined },
        },
      }
    );
  });
});
