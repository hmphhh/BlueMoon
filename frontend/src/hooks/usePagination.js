import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * usePagination — shared hook for all paginated list screens.
 *
 * Conventions:
 *   - currentPage is 1-based (matches UI / PaginationControls)
 *   - The hook exposes apiPage = currentPage - 1 for backend calls (0-based)
 *   - debouncedSearch fires 400ms after the last keystroke
 *   - Changing search, filters, or pageSize resets currentPage to 1
 *   - Provides a ref-based AbortController so only the latest request wins
 *
 * Usage:
 *   const {
 *     currentPage, pageSize, debouncedSearch, apiPage,
 *     setCurrentPage, setPageSize, setSearch, search,
 *     getAbortSignal, resetPage,
 *   } = usePagination({ initialPageSize: 10, debounceMs: 400 });
 */
export default function usePagination({
    initialPageSize = 10,
    debounceMs = 400,
} = {}) {
    const [currentPage, setCurrentPageInternal] = useState(1);
    const [pageSize, setPageSizeInternal] = useState(initialPageSize);
    const [search, setSearchInternal] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const abortRef = useRef(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [search, debounceMs]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPageInternal(1);
    }, [debouncedSearch]);

    /** Set current page (1-based). Clamps to minimum 1. */
    const setCurrentPage = useCallback((page) => {
        setCurrentPageInternal(Math.max(1, page));
    }, []);

    /** Change page size and reset to page 1. */
    const setPageSize = useCallback((size) => {
        setPageSizeInternal(size);
        setCurrentPageInternal(1);
    }, []);

    /** Update raw search string; debounce + page reset handled automatically. */
    const setSearch = useCallback((value) => {
        setSearchInternal(value);
    }, []);

    /** Explicitly reset to page 1 (e.g. after a filter change). */
    const resetPage = useCallback(() => {
        setCurrentPageInternal(1);
    }, []);

    /**
     * Returns an AbortSignal for the current request.
     * Aborts any previous in-flight request automatically.
     */
    const getAbortSignal = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        abortRef.current = new AbortController();
        return abortRef.current.signal;
    }, []);

    /**
     * Call this when an item is deleted and the page may now be empty.
     * Pass the number of items remaining after deletion.
     */
    const handleDeleteRebalance = useCallback((remainingCount) => {
        if (remainingCount === 0 && currentPage > 1) {
            setCurrentPageInternal(prev => prev - 1);
        }
    }, [currentPage]);

    return {
        currentPage,         // 1-based — use in PaginationControls + display
        apiPage: currentPage - 1, // 0-based — send directly to backend
        pageSize,
        search,
        debouncedSearch,
        setCurrentPage,
        setPageSize,
        setSearch,
        resetPage,
        getAbortSignal,
        handleDeleteRebalance,
    };
}
