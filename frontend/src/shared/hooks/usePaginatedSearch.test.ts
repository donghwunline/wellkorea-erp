/**
 * Unit tests for usePaginatedSearch hook.
 * Tests pagination state, search state, and their interactions.
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePaginatedSearch } from './usePaginatedSearch';

describe('usePaginatedSearch', () => {
  // ==========================================================================
  // INITIAL STATE
  // ==========================================================================

  describe('initial state', () => {
    it('should initialize with default values', () => {
      // When: Create hook with no options
      const { result } = renderHook(() => usePaginatedSearch());

      // Then: All values are at defaults
      expect(result.current.page).toBe(0);
      expect(result.current.search).toBe('');
      expect(result.current.searchInput).toBe('');
    });

    it('should accept custom initial page', () => {
      // When: Create hook with initialPage
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialPage: 5 })
      );

      // Then: Page starts at custom value
      expect(result.current.page).toBe(5);
    });

    it('should accept custom initial search', () => {
      // When: Create hook with initialSearch
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialSearch: 'test query' })
      );

      // Then: Both search and searchInput start at custom value
      expect(result.current.search).toBe('test query');
      expect(result.current.searchInput).toBe('test query');
    });

    it('should accept both initial values together', () => {
      // When: Create hook with both options
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialPage: 3, initialSearch: 'hello' })
      );

      // Then: Both values are set
      expect(result.current.page).toBe(3);
      expect(result.current.search).toBe('hello');
      expect(result.current.searchInput).toBe('hello');
    });
  });

  // ==========================================================================
  // PAGINATION
  // ==========================================================================

  describe('pagination', () => {
    it('should update page with setPage', () => {
      // Given: Hook at initial state
      const { result } = renderHook(() => usePaginatedSearch());

      // When: Set page to 10
      act(() => {
        result.current.setPage(10);
      });

      // Then: Page is updated
      expect(result.current.page).toBe(10);
    });

    it('should allow setting page to 0', () => {
      // Given: Hook at page 5
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialPage: 5 })
      );

      // When: Set page to 0
      act(() => {
        result.current.setPage(0);
      });

      // Then: Page is 0
      expect(result.current.page).toBe(0);
    });
  });

  // ==========================================================================
  // SEARCH INPUT
  // ==========================================================================

  describe('search input', () => {
    it('should update searchInput on handleSearchChange', () => {
      // Given: Hook at initial state
      const { result } = renderHook(() => usePaginatedSearch());

      // When: Type in search
      act(() => {
        result.current.handleSearchChange('typing...');
      });

      // Then: searchInput is updated but search is not
      expect(result.current.searchInput).toBe('typing...');
      expect(result.current.search).toBe('');
    });

    it('should not update search value until submit', () => {
      // Given: Hook at initial state
      const { result } = renderHook(() => usePaginatedSearch());

      // When: Type multiple characters
      act(() => {
        result.current.handleSearchChange('t');
      });
      act(() => {
        result.current.handleSearchChange('te');
      });
      act(() => {
        result.current.handleSearchChange('tes');
      });
      act(() => {
        result.current.handleSearchChange('test');
      });

      // Then: searchInput reflects typing, search is still empty
      expect(result.current.searchInput).toBe('test');
      expect(result.current.search).toBe('');
    });
  });

  // ==========================================================================
  // SEARCH SUBMIT
  // ==========================================================================

  describe('search submit', () => {
    it('should update search value on handleSearchSubmit', () => {
      // Given: Hook with typed input
      const { result } = renderHook(() => usePaginatedSearch());
      act(() => {
        result.current.handleSearchChange('samsung');
      });

      // When: Submit search
      act(() => {
        result.current.handleSearchSubmit();
      });

      // Then: search value is updated
      expect(result.current.search).toBe('samsung');
      expect(result.current.searchInput).toBe('samsung');
    });

    it('should reset page to 0 on search submit', () => {
      // Given: Hook on page 5 with typed input
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialPage: 5 })
      );
      act(() => {
        result.current.handleSearchChange('new search');
      });

      // When: Submit search
      act(() => {
        result.current.handleSearchSubmit();
      });

      // Then: Page is reset to 0
      expect(result.current.page).toBe(0);
      expect(result.current.search).toBe('new search');
    });

    it('should handle empty search submit', () => {
      // Given: Hook with empty input
      const { result } = renderHook(() => usePaginatedSearch());

      // When: Submit empty search
      act(() => {
        result.current.handleSearchSubmit();
      });

      // Then: search is empty, page is 0
      expect(result.current.search).toBe('');
      expect(result.current.page).toBe(0);
    });
  });

  // ==========================================================================
  // AUTO-CLEAR ON EMPTY INPUT
  // ==========================================================================

  describe('auto-clear on empty input', () => {
    it('should clear search when input is emptied', () => {
      // Given: Hook with active search
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialSearch: 'active search' })
      );
      expect(result.current.search).toBe('active search');

      // When: Clear input completely
      act(() => {
        result.current.handleSearchChange('');
      });

      // Then: Both searchInput and search are cleared
      expect(result.current.searchInput).toBe('');
      expect(result.current.search).toBe('');
    });

    it('should reset page when input is emptied', () => {
      // Given: Hook on page 5 with active search
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialPage: 5, initialSearch: 'test' })
      );

      // When: Clear input
      act(() => {
        result.current.handleSearchChange('');
      });

      // Then: Page is reset to 0
      expect(result.current.page).toBe(0);
    });

    it('should not affect search when input has content', () => {
      // Given: Hook with typed input (not empty)
      const { result } = renderHook(() => usePaginatedSearch());
      act(() => {
        result.current.handleSearchChange('typing');
      });
      act(() => {
        result.current.handleSearchSubmit();
      });

      // When: Modify input (but not empty)
      act(() => {
        result.current.handleSearchChange('typin');
      });

      // Then: search stays at submitted value
      expect(result.current.search).toBe('typing');
      expect(result.current.searchInput).toBe('typin');
    });
  });

  // ==========================================================================
  // CLEAR SEARCH
  // ==========================================================================

  describe('clear search', () => {
    it('should clear both searchInput and search on handleClearSearch', () => {
      // Given: Hook with active search
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialSearch: 'some query' })
      );

      // When: Clear search
      act(() => {
        result.current.handleClearSearch();
      });

      // Then: Both are cleared
      expect(result.current.searchInput).toBe('');
      expect(result.current.search).toBe('');
    });

    it('should reset page on handleClearSearch', () => {
      // Given: Hook on page 10 with search
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialPage: 10, initialSearch: 'test' })
      );

      // When: Clear search
      act(() => {
        result.current.handleClearSearch();
      });

      // Then: Page is reset to 0
      expect(result.current.page).toBe(0);
    });

    it('should work when already empty', () => {
      // Given: Hook with no search
      const { result } = renderHook(() => usePaginatedSearch());

      // When: Clear search (already empty)
      act(() => {
        result.current.handleClearSearch();
      });

      // Then: Remains empty, no errors
      expect(result.current.searchInput).toBe('');
      expect(result.current.search).toBe('');
      expect(result.current.page).toBe(0);
    });
  });

  // ==========================================================================
  // COMPLEX SCENARIOS
  // ==========================================================================

  describe('complex scenarios', () => {
    it('should handle search → navigate → new search flow', () => {
      const { result } = renderHook(() => usePaginatedSearch());

      // Step 1: Search for "samsung"
      act(() => {
        result.current.handleSearchChange('samsung');
      });
      act(() => {
        result.current.handleSearchSubmit();
      });
      expect(result.current.search).toBe('samsung');
      expect(result.current.page).toBe(0);

      // Step 2: Navigate to page 3
      act(() => {
        result.current.setPage(3);
      });
      expect(result.current.page).toBe(3);
      expect(result.current.search).toBe('samsung');

      // Step 3: New search for "lg"
      act(() => {
        result.current.handleSearchChange('lg');
      });
      act(() => {
        result.current.handleSearchSubmit();
      });
      expect(result.current.search).toBe('lg');
      expect(result.current.page).toBe(0); // Reset on new search
    });

    it('should handle clear → new search flow', () => {
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialSearch: 'initial', initialPage: 5 })
      );

      // Step 1: Clear search
      act(() => {
        result.current.handleClearSearch();
      });
      expect(result.current.search).toBe('');
      expect(result.current.page).toBe(0);

      // Step 2: New search
      act(() => {
        result.current.handleSearchChange('new query');
      });
      act(() => {
        result.current.handleSearchSubmit();
      });
      expect(result.current.search).toBe('new query');
      expect(result.current.page).toBe(0);
    });

    it('should handle typing without submit then clear', () => {
      const { result } = renderHook(() =>
        usePaginatedSearch({ initialSearch: 'original' })
      );

      // Step 1: Type but don't submit
      act(() => {
        result.current.handleSearchChange('typing...');
      });
      expect(result.current.searchInput).toBe('typing...');
      expect(result.current.search).toBe('original'); // Unchanged

      // Step 2: Clear
      act(() => {
        result.current.handleClearSearch();
      });
      expect(result.current.searchInput).toBe('');
      expect(result.current.search).toBe('');
    });
  });

  // ==========================================================================
  // CALLBACK STABILITY
  // ==========================================================================

  describe('callback stability', () => {
    it('should have stable setPage function', () => {
      const { result, rerender } = renderHook(() => usePaginatedSearch());
      const initialSetPage = result.current.setPage;

      rerender();

      expect(result.current.setPage).toBe(initialSetPage);
    });

    it('should have stable handleSearchChange function', () => {
      const { result, rerender } = renderHook(() => usePaginatedSearch());
      const initialHandler = result.current.handleSearchChange;

      rerender();

      expect(result.current.handleSearchChange).toBe(initialHandler);
    });

    it('should have stable handleClearSearch function', () => {
      const { result, rerender } = renderHook(() => usePaginatedSearch());
      const initialHandler = result.current.handleClearSearch;

      rerender();

      expect(result.current.handleClearSearch).toBe(initialHandler);
    });
  });
});
