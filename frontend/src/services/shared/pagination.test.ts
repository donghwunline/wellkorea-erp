/**
 * Unit tests for pagination utilities.
 * Tests pagination transformation logic and metadata fallback behavior.
 */

import { describe, it, expect } from 'vitest';
import { transformPagedResponse, createEmptyPaginated } from './pagination';
import type { PagedResponse, PaginationMetadata, Paginated } from '@/api/types';

describe('pagination utilities', () => {
  describe('transformPagedResponse', () => {
    it('should transform PagedResponse with metadata to Paginated format', () => {
      // Given: PagedResponse with metadata
      const pagedData: PagedResponse<{ id: number; name: string }> = {
        content: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        number: 0,
        size: 20,
        totalElements: 50,
        totalPages: 3,
        first: true,
        last: false,
      };

      const metadata: PaginationMetadata = {
        page: 0,
        size: 20,
        totalElements: 50,
        totalPages: 3,
        first: true,
        last: false,
      };

      // When: Transform to Paginated
      const result = transformPagedResponse(pagedData, metadata);

      // Then: Uses metadata fields (preferred)
      expect(result.data).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]);
      expect(result.pagination).toEqual({
        page: 0,
        size: 20,
        totalElements: 50,
        totalPages: 3,
        first: true,
        last: false,
      });
    });

    it('should fallback to PagedResponse fields when metadata is missing', () => {
      // Given: PagedResponse without metadata
      const pagedData: PagedResponse<{ id: number }> = {
        content: [{ id: 1 }, { id: 2 }, { id: 3 }],
        number: 1, // Note: 'number' field (not 'page')
        size: 10,
        totalElements: 30,
        totalPages: 3,
        first: false,
        last: false,
      };

      // When: Transform without metadata
      const result = transformPagedResponse(pagedData);

      // Then: Falls back to PagedResponse.number (becomes 'page')
      expect(result.data).toHaveLength(3);
      expect(result.pagination.page).toBe(1); // From pagedData.number
      expect(result.pagination.size).toBe(10);
      expect(result.pagination.totalElements).toBe(30);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.first).toBe(false);
      expect(result.pagination.last).toBe(false);
    });

    it('should prefer metadata over PagedResponse when both exist', () => {
      // Given: Both metadata and PagedResponse with different values
      const pagedData: PagedResponse<string> = {
        content: ['a', 'b'],
        number: 5, // Different from metadata
        size: 100,
        totalElements: 500,
        totalPages: 5,
        first: false,
        last: true,
      };

      const metadata: PaginationMetadata = {
        page: 2, // Preferred value
        size: 20,
        totalElements: 100,
        totalPages: 5,
        first: false,
        last: false,
      };

      // When: Transform with both sources
      const result = transformPagedResponse(pagedData, metadata);

      // Then: Uses metadata values (not PagedResponse)
      expect(result.pagination.page).toBe(2); // From metadata, not pagedData.number (5)
      expect(result.pagination.size).toBe(20); // From metadata, not pagedData.size (100)
      expect(result.pagination.totalElements).toBe(100); // From metadata
      expect(result.pagination.last).toBe(false); // From metadata, not pagedData.last (true)
    });

    it('should handle partial metadata (mixed sources)', () => {
      // Given: Partial metadata (only some fields)
      const pagedData: PagedResponse<number> = {
        content: [1, 2, 3],
        number: 0,
        size: 10,
        totalElements: 25,
        totalPages: 3,
        first: true,
        last: false,
      };

      const partialMetadata = {
        page: 0,
        size: 10,
        // Missing: totalElements, totalPages, first, last
      };

      // When: Transform with partial metadata
      const result = transformPagedResponse(pagedData, partialMetadata);

      // Then: Uses metadata where available, falls back for missing fields
      expect(result.pagination.page).toBe(0); // From metadata
      expect(result.pagination.size).toBe(10); // From metadata
      expect(result.pagination.totalElements).toBe(25); // Fallback to pagedData
      expect(result.pagination.totalPages).toBe(3); // Fallback to pagedData
      expect(result.pagination.first).toBe(true); // Fallback to pagedData
      expect(result.pagination.last).toBe(false); // Fallback to pagedData
    });

    it('should handle empty content array', () => {
      // Given: Empty PagedResponse
      const pagedData: PagedResponse<unknown> = {
        content: [],
        number: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      };

      // When: Transform empty page
      const result = transformPagedResponse(pagedData);

      // Then: Returns empty data array with correct pagination
      expect(result.data).toEqual([]);
      expect(result.pagination.totalElements).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.first).toBe(true);
      expect(result.pagination.last).toBe(true);
    });

    it('should handle first page correctly', () => {
      // Given: First page of results
      const pagedData: PagedResponse<string> = {
        content: ['first', 'second'],
        number: 0,
        size: 2,
        totalElements: 10,
        totalPages: 5,
        first: true,
        last: false,
      };

      // When: Transform first page
      const result = transformPagedResponse(pagedData);

      // Then: Correct first/last flags
      expect(result.pagination.page).toBe(0);
      expect(result.pagination.first).toBe(true);
      expect(result.pagination.last).toBe(false);
    });

    it('should handle last page correctly', () => {
      // Given: Last page of results
      const pagedData: PagedResponse<string> = {
        content: ['last'],
        number: 4,
        size: 2,
        totalElements: 9,
        totalPages: 5,
        first: false,
        last: true,
      };

      // When: Transform last page
      const result = transformPagedResponse(pagedData);

      // Then: Correct first/last flags
      expect(result.pagination.page).toBe(4);
      expect(result.pagination.first).toBe(false);
      expect(result.pagination.last).toBe(true);
    });

    it('should handle single page result', () => {
      // Given: Single page (all results fit)
      const pagedData: PagedResponse<number> = {
        content: [1, 2, 3],
        number: 0,
        size: 20,
        totalElements: 3,
        totalPages: 1,
        first: true,
        last: true,
      };

      // When: Transform single page
      const result = transformPagedResponse(pagedData);

      // Then: Both first and last are true
      expect(result.data).toHaveLength(3);
      expect(result.pagination.page).toBe(0);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.first).toBe(true);
      expect(result.pagination.last).toBe(true);
    });

    it('should preserve complex object types in content', () => {
      // Given: Complex objects in content
      interface ComplexItem {
        id: number;
        name: string;
        nested: { value: string };
        array: number[];
      }

      const pagedData: PagedResponse<ComplexItem> = {
        content: [
          {
            id: 1,
            name: 'Complex',
            nested: { value: 'nested' },
            array: [1, 2, 3],
          },
        ],
        number: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      };

      // When: Transform with complex types
      const result: Paginated<ComplexItem> = transformPagedResponse(pagedData);

      // Then: Complex types preserved
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].nested.value).toBe('nested');
      expect(result.data[0].array).toEqual([1, 2, 3]);
    });
  });

  describe('createEmptyPaginated', () => {
    it('should create empty Paginated structure', () => {
      // When: Create empty paginated
      const result = createEmptyPaginated<string>();

      // Then: Returns empty structure
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        page: 0,
        size: 0,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      });
    });

    it('should work with different generic types', () => {
      // When: Create empty paginated with different types
      const stringPaginated = createEmptyPaginated<string>();
      const numberPaginated = createEmptyPaginated<number>();
      const objectPaginated = createEmptyPaginated<{ id: number }>();

      // Then: All return correctly typed empty structures
      expect(stringPaginated.data).toEqual([]);
      expect(numberPaginated.data).toEqual([]);
      expect(objectPaginated.data).toEqual([]);

      // And: All have same pagination structure
      expect(stringPaginated.pagination).toEqual(numberPaginated.pagination);
      expect(numberPaginated.pagination).toEqual(objectPaginated.pagination);
    });

    it('should indicate both first and last for empty result', () => {
      // When: Create empty paginated
      const result = createEmptyPaginated();

      // Then: Both first and last are true (no pages exist)
      expect(result.pagination.first).toBe(true);
      expect(result.pagination.last).toBe(true);
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});
