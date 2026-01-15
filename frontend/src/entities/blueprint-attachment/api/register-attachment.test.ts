/**
 * Register Attachment Command Tests.
 *
 * Tests for registering attachment metadata after successful MinIO upload.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { registerAttachment, type RegisterAttachmentInput } from './register-attachment';

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
  };
});

vi.mock('@/shared/config/endpoints', () => ({
  BLUEPRINT_ENDPOINTS: {
    register: (flowId: number, nodeId: string) =>
      `/api/task-flows/${flowId}/nodes/${nodeId}/attachments/register`,
  },
}));

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(overrides?: Partial<RegisterAttachmentInput>): RegisterAttachmentInput {
  return {
    flowId: 1,
    nodeId: 'node-1',
    fileName: 'blueprint.pdf',
    fileSize: 1024,
    objectKey: 'blueprints/flow-1/node-node-1/blueprint.pdf',
    ...overrides,
  };
}

function createCommandResult(id: number = 1) {
  return {
    id,
    message: 'Attachment registered successfully',
  };
}

describe('registerAttachment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue(createCommandResult());
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct endpoint', async () => {
      const input = createValidInput({ flowId: 5, nodeId: 'my-node' });

      await registerAttachment(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/task-flows/5/nodes/my-node/attachments/register',
        expect.any(Object)
      );
    });

    it('should send correct request body', async () => {
      const input = createValidInput({
        fileName: 'drawing.pdf',
        fileSize: 2048,
        objectKey: 'blueprints/flow-1/node-1/drawing.pdf',
      });

      await registerAttachment(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          fileName: 'drawing.pdf',
          fileSize: 2048,
          objectKey: 'blueprints/flow-1/node-1/drawing.pdf',
        }
      );
    });

    it('should return CommandResult on success', async () => {
      const expectedResult = {
        id: 42,
        message: 'Attachment registered successfully',
      };
      mockHttpClient.post.mockResolvedValue(expectedResult);

      const input = createValidInput();
      const result = await registerAttachment(input);

      expect(result).toEqual(expectedResult);
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);

      const input = createValidInput();

      await expect(registerAttachment(input)).rejects.toThrow('Network error');
    });

    it('should handle backend validation errors', async () => {
      const error = new Error('File not found in storage');
      mockHttpClient.post.mockRejectedValue(error);

      const input = createValidInput();

      await expect(registerAttachment(input)).rejects.toThrow('File not found in storage');
    });
  });

  // ==========================================================================
  // Input Handling Tests
  // ==========================================================================

  describe('input handling', () => {
    it('should pass all input fields to the request', async () => {
      const input: RegisterAttachmentInput = {
        flowId: 10,
        nodeId: 'complex-node-id',
        fileName: 'test-file.dwg',
        fileSize: 5000000,
        objectKey: 'blueprints/flow-10/node-complex-node-id/test-file.dwg',
      };

      await registerAttachment(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/task-flows/10/nodes/complex-node-id/attachments/register',
        {
          fileName: 'test-file.dwg',
          fileSize: 5000000,
          objectKey: 'blueprints/flow-10/node-complex-node-id/test-file.dwg',
        }
      );
    });

    it('should handle special characters in nodeId', async () => {
      const input = createValidInput({ nodeId: 'node_with-special.chars' });

      await registerAttachment(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/task-flows/1/nodes/node_with-special.chars/attachments/register',
        expect.any(Object)
      );
    });

    it('should handle unicode file names', async () => {
      const input = createValidInput({ fileName: '도면_설계서.pdf' });

      await registerAttachment(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          fileName: '도면_설계서.pdf',
        })
      );
    });

    it('should handle large file sizes', async () => {
      const largeSize = 50 * 1024 * 1024; // 50MB
      const input = createValidInput({ fileSize: largeSize });

      await registerAttachment(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          fileSize: largeSize,
        })
      );
    });
  });
});
