/**
 * Get Upload URL Command Tests.
 *
 * Tests for input validation and API call for presigned upload URL.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getUploadUrl, type GetUploadUrlInput } from './get-upload-url';
import { DomainValidationError } from '@/shared/lib/errors/domain-validation-error';

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
    uploadUrl: (flowId: number, nodeId: string) =>
      `/api/task-flows/${flowId}/nodes/${nodeId}/attachments/upload-url`,
  },
}));

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(overrides?: Partial<GetUploadUrlInput>): GetUploadUrlInput {
  return {
    flowId: 1,
    nodeId: 'node-1',
    fileName: 'blueprint.pdf',
    fileSize: 1024,
    contentType: 'application/pdf',
    ...overrides,
  };
}

function createUploadUrlResponse() {
  return {
    uploadUrl: 'https://minio.example.com/bucket/blueprints/flow-1/node-1/blueprint.pdf?presigned',
    objectKey: 'blueprints/flow-1/node-1/blueprint.pdf',
  };
}

describe('getUploadUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue(createUploadUrlResponse());
  });

  // ==========================================================================
  // Validation Tests - flowId
  // ==========================================================================

  describe('validation - flowId', () => {
    it('should pass with valid flowId', async () => {
      const input = createValidInput({ flowId: 1 });
      await expect(getUploadUrl(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when flowId is null', async () => {
      const input = createValidInput({ flowId: null as unknown as number });

      await expect(getUploadUrl(input)).rejects.toThrow(DomainValidationError);

      try {
        await getUploadUrl(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('flowId');
        expect(e.message).toContain('TaskFlow');
      }
    });

    it('should throw REQUIRED error when flowId is 0', async () => {
      const input = createValidInput({ flowId: 0 });

      await expect(getUploadUrl(input)).rejects.toThrow(DomainValidationError);

      try {
        await getUploadUrl(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('flowId');
      }
    });

    it('should throw REQUIRED error when flowId is negative', async () => {
      const input = createValidInput({ flowId: -1 });

      await expect(getUploadUrl(input)).rejects.toThrow(DomainValidationError);
    });
  });

  // ==========================================================================
  // Validation Tests - nodeId
  // ==========================================================================

  describe('validation - nodeId', () => {
    it('should pass with valid nodeId', async () => {
      const input = createValidInput({ nodeId: 'node-123' });
      await expect(getUploadUrl(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when nodeId is empty', async () => {
      const input = createValidInput({ nodeId: '' });

      await expect(getUploadUrl(input)).rejects.toThrow(DomainValidationError);

      try {
        await getUploadUrl(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('nodeId');
        expect(e.message).toContain('Node ID');
      }
    });

    it('should throw REQUIRED error when nodeId is whitespace only', async () => {
      const input = createValidInput({ nodeId: '   ' });

      await expect(getUploadUrl(input)).rejects.toThrow(DomainValidationError);
    });
  });

  // ==========================================================================
  // Validation Tests - fileName
  // ==========================================================================

  describe('validation - fileName', () => {
    it('should pass with valid fileName', async () => {
      const input = createValidInput({ fileName: 'blueprint.pdf' });
      await expect(getUploadUrl(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when fileName is empty', async () => {
      const input = createValidInput({ fileName: '' });

      await expect(getUploadUrl(input)).rejects.toThrow(DomainValidationError);

      try {
        await getUploadUrl(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('fileName');
        expect(e.message).toContain('File name');
      }
    });

    it('should throw INVALID error for disallowed file extension', async () => {
      const input = createValidInput({ fileName: 'script.exe' });

      await expect(getUploadUrl(input)).rejects.toThrow(DomainValidationError);

      try {
        await getUploadUrl(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('INVALID');
        expect(e.fieldPath).toBe('fileName');
        expect(e.message).toContain('File type not allowed');
      }
    });

    it('should accept all allowed file extensions', async () => {
      const allowedFiles = ['file.pdf', 'file.dxf', 'file.dwg', 'file.png', 'file.jpg', 'file.jpeg'];

      for (const fileName of allowedFiles) {
        const input = createValidInput({ fileName });
        await expect(getUploadUrl(input)).resolves.not.toThrow();
      }
    });

    it('should be case-insensitive for file extensions', async () => {
      const mixedCaseFiles = ['file.PDF', 'file.DXF', 'file.Dwg', 'file.PNG', 'file.JPG', 'file.JPEG'];

      for (const fileName of mixedCaseFiles) {
        const input = createValidInput({ fileName });
        await expect(getUploadUrl(input)).resolves.not.toThrow();
      }
    });
  });

  // ==========================================================================
  // Validation Tests - fileSize
  // ==========================================================================

  describe('validation - fileSize', () => {
    it('should pass with valid fileSize', async () => {
      const input = createValidInput({ fileSize: 1024 });
      await expect(getUploadUrl(input)).resolves.not.toThrow();
    });

    it('should throw INVALID error when fileSize is 0', async () => {
      const input = createValidInput({ fileSize: 0 });

      await expect(getUploadUrl(input)).rejects.toThrow(DomainValidationError);

      try {
        await getUploadUrl(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('INVALID');
        expect(e.fieldPath).toBe('fileSize');
        expect(e.message).toContain('empty');
      }
    });

    it('should throw INVALID error when fileSize is negative', async () => {
      const input = createValidInput({ fileSize: -100 });

      await expect(getUploadUrl(input)).rejects.toThrow(DomainValidationError);
    });

    it('should throw OUT_OF_RANGE error when fileSize exceeds max', async () => {
      const input = createValidInput({ fileSize: 100 * 1024 * 1024 }); // 100MB (exceeds 50MB limit)

      await expect(getUploadUrl(input)).rejects.toThrow(DomainValidationError);

      try {
        await getUploadUrl(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('OUT_OF_RANGE');
        expect(e.fieldPath).toBe('fileSize');
        expect(e.message).toContain('maximum');
      }
    });

    it('should accept fileSize at maximum limit', async () => {
      const input = createValidInput({ fileSize: 50 * 1024 * 1024 }); // Exactly 50MB
      await expect(getUploadUrl(input)).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct endpoint', async () => {
      const input = createValidInput({ flowId: 5, nodeId: 'my-node' });

      await getUploadUrl(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/task-flows/5/nodes/my-node/attachments/upload-url',
        expect.any(Object)
      );
    });

    it('should send correct request body', async () => {
      const input = createValidInput({
        fileName: 'drawing.pdf',
        fileSize: 2048,
        contentType: 'application/pdf',
      });

      await getUploadUrl(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          fileName: 'drawing.pdf',
          fileSize: 2048,
          contentType: 'application/pdf',
        }
      );
    });

    it('should return UploadUrlResponse on success', async () => {
      const expectedResponse = {
        uploadUrl: 'https://minio.example.com/presigned-url',
        objectKey: 'blueprints/path/to/file.pdf',
      };
      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const input = createValidInput();
      const result = await getUploadUrl(input);

      expect(result).toEqual(expectedResponse);
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);

      const input = createValidInput();

      await expect(getUploadUrl(input)).rejects.toThrow('Network error');
    });
  });
});
